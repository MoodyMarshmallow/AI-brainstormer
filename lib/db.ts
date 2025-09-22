import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { cache } from "react";
import type { BrainstormResponseBody, NodeRecord, Session, SessionWithNodes } from "./types";

interface DatabaseAdapter {
  createSession(title: string): Promise<Session>;
  getSessionById(id: string): Promise<SessionWithNodes | null>;
  getSessionByShareToken(token: string): Promise<SessionWithNodes | null>;
  insertNode(node: {
    sessionId: string;
    parentId: string | null;
    persona: NodeRecord["persona"];
    content: string;
    x?: number | null;
    y?: number | null;
  }): Promise<NodeRecord>;
  insertChildren(nodes: Array<{
    sessionId: string;
    parentId: string | null;
    persona: NodeRecord["persona"];
    content: string;
    x?: number | null;
    y?: number | null;
  }>): Promise<NodeRecord[]>;
}

const inMemory = createInMemoryAdapter();

function createInMemoryAdapter(): DatabaseAdapter {
  const sessions = new Map<string, Session>();
  const shareIndex = new Map<string, string>();
  const nodes = new Map<string, NodeRecord>();

  const makeSession = (title: string): Session => {
    const id = randomUUID();
    const shareToken = generateShareToken();
    const session: Session = {
      id,
      title,
      shareToken,
      isPublic: true,
      createdAt: new Date().toISOString(),
      createdBy: null
    };
    sessions.set(id, session);
    shareIndex.set(shareToken, id);
    return session;
  };

  const makeNode = (payload: {
    sessionId: string;
    parentId: string | null;
    persona: NodeRecord["persona"];
    content: string;
    x?: number | null;
    y?: number | null;
  }): NodeRecord => {
    const id = randomUUID();
    const record: NodeRecord = {
      id,
      sessionId: payload.sessionId,
      parentId: payload.parentId,
      persona: payload.persona,
      content: payload.content,
      x: payload.x ?? null,
      y: payload.y ?? null,
      createdAt: new Date().toISOString()
    };
    nodes.set(id, record);
    return record;
  };

  return {
    async createSession(title: string) {
      return makeSession(title);
    },
    async getSessionById(id: string) {
      const session = sessions.get(id);
      if (!session) return null;
      return {
        session,
        nodes: Array.from(nodes.values()).filter((n) => n.sessionId === id)
      };
    },
    async getSessionByShareToken(token: string) {
      const id = shareIndex.get(token);
      if (!id) return null;
      return this.getSessionById(id);
    },
    async insertNode(payload) {
      return makeNode(payload);
    },
    async insertChildren(payloads) {
      return payloads.map((payload) =>
        makeNode({
          sessionId: payload.sessionId,
          parentId: payload.parentId,
          persona: payload.persona,
          content: payload.content,
          x: payload.x ?? null,
          y: payload.y ?? null
        })
      );
    }
  };
}

function getSupabaseAdapter(): DatabaseAdapter | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const client: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false }
  });

  return {
    async createSession(title: string) {
      const shareToken = generateShareToken();
      const { data, error } = await client
        .from("sessions")
        .insert({
          title,
          share_token: shareToken,
          is_public: true
        })
        .select()
        .single();
      if (error) throw error;
      return normalizeSession(data);
    },
    async getSessionById(id: string) {
      const { data: session, error } = await client
        .from("sessions")
        .select()
        .eq("id", id)
        .single();
      if (error || !session) return null;
      const { data: nodes, error: nodeError } = await client
        .from("nodes")
        .select()
        .eq("session_id", id)
        .order("created_at", { ascending: true });
      if (nodeError) throw nodeError;
      return {
        session: normalizeSession(session),
        nodes: (nodes ?? []).map(normalizeNode)
      };
    },
    async getSessionByShareToken(token: string) {
      const { data: session, error } = await client
        .from("sessions")
        .select()
        .eq("share_token", token)
        .single();
      if (error || !session) return null;
      return this.getSessionById(session.id as string);
    },
    async insertNode(payload) {
      const { data, error } = await client
        .from("nodes")
        .insert({
          session_id: payload.sessionId,
          parent_id: payload.parentId,
          persona: payload.persona,
          content: payload.content,
          x: payload.x ?? null,
          y: payload.y ?? null
        })
        .select()
        .single();
      if (error) throw error;
      return normalizeNode(data);
    },
    async insertChildren(payloads) {
      if (payloads.length === 0) return [];
      const { data, error } = await client
        .from("nodes")
        .insert(
          payloads.map((payload) => ({
            session_id: payload.sessionId,
            parent_id: payload.parentId,
            persona: payload.persona,
            content: payload.content,
            x: payload.x ?? null,
            y: payload.y ?? null
          }))
        )
        .select();
      if (error) throw error;
      return (data ?? []).map(normalizeNode);
    }
  };
}

function normalizeSession(row: any): Session {
  return {
    id: row.id,
    title: row.title,
    shareToken: row.share_token,
    isPublic: row.is_public ?? true,
    createdAt: row.created_at,
    createdBy: row.created_by ?? null
  };
}

function normalizeNode(row: any): NodeRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    parentId: row.parent_id,
    persona: row.persona,
    content: row.content,
    x: row.x,
    y: row.y,
    createdAt: row.created_at
  };
}

function generateShareToken() {
  return randomUUID().slice(0, 8);
}

const adapter = getSupabaseAdapter() ?? inMemory;

export const createSession = (title: string) => adapter.createSession(title);

export const getSessionById = cache((id: string) => adapter.getSessionById(id));

export const getSessionByShareToken = cache((token: string) =>
  adapter.getSessionByShareToken(token)
);

export const insertNode = (payload: {
  sessionId: string;
  parentId: string | null;
  persona: NodeRecord["persona"];
  content: string;
  x?: number | null;
  y?: number | null;
}) => adapter.insertNode(payload);

export const insertChildren = (nodes: Array<{
  sessionId: string;
  parentId: string | null;
  persona: NodeRecord["persona"];
  content: string;
  x?: number | null;
  y?: number | null;
}>) => adapter.insertChildren(nodes);

export async function saveBrainstormResult(
  response: BrainstormResponseBody
): Promise<BrainstormResponseBody> {
  return response;
}
