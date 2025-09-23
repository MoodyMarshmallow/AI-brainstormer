import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { cache } from "react";
import type { BrainstormResponseBody, NodeRecord, Session, SessionWithNodes } from "./types";

type SessionRow = {
  id: string;
  title: string | null;
  share_token: string;
  is_public: boolean | null;
  created_at: string;
  created_by: string | null;
};

type NodeRow = {
  id: string;
  session_id: string;
  parent_id: string | null;
  persona: NodeRecord["persona"];
  content: string;
  x: number | null;
  y: number | null;
  created_at: string;
};

interface DatabaseAdapter {
  listSessions(): Promise<Session[]>;
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
  deleteSession(id: string): Promise<void>;
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
    async listSessions() {
      return Array.from(sessions.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
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
    },
    async deleteSession(id: string) {
      sessions.delete(id);
      for (const [nodeId, node] of nodes.entries()) {
        if (node.sessionId === id) {
          nodes.delete(nodeId);
        }
      }
      for (const [token, sessionId] of shareIndex.entries()) {
        if (sessionId === id) {
          shareIndex.delete(token);
        }
      }
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
    async listSessions() {
      try {
        const { data, error } = await client
          .from("sessions")
          .select()
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []).map(normalizeSession);
      } catch (error) {
        console.warn("Supabase listSessions failed, falling back to in-memory store", error);
        return inMemory.listSessions();
      }
    },
    async createSession(title: string) {
      try {
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
      } catch (error) {
        console.warn("Supabase createSession failed, falling back to in-memory store", error);
        return inMemory.createSession(title);
      }
    },
    async getSessionById(id: string) {
      try {
        const { data: session, error } = await client
          .from("sessions")
          .select()
          .eq("id", id)
          .single();
        if (error) {
          console.warn("Supabase getSessionById returned error, using in-memory store", error);
          return inMemory.getSessionById(id);
        }
        if (!session) return null;
        const { data: nodes, error: nodeError } = await client
          .from("nodes")
          .select()
          .eq("session_id", id)
          .order("created_at", { ascending: true });
        if (nodeError) {
          console.warn(
            "Supabase getSessionById nodes query failed, using in-memory store",
            nodeError
          );
          return inMemory.getSessionById(id);
        }
        return {
          session: normalizeSession(session),
          nodes: (nodes ?? []).map(normalizeNode)
        };
      } catch (error) {
        console.warn("Supabase getSessionById failed, falling back to in-memory store", error);
        return inMemory.getSessionById(id);
      }
    },
    async getSessionByShareToken(token: string) {
      try {
        const { data: session, error } = await client
          .from("sessions")
          .select()
          .eq("share_token", token)
          .single();
        if (error) {
          console.warn(
            "Supabase getSessionByShareToken returned error, using in-memory store",
            error
          );
          return inMemory.getSessionByShareToken(token);
        }
        if (!session) return null;
        return this.getSessionById(session.id as string);
      } catch (error) {
        console.warn(
          "Supabase getSessionByShareToken failed, falling back to in-memory store",
          error
        );
        return inMemory.getSessionByShareToken(token);
      }
    },
    async insertNode(payload) {
      try {
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
      } catch (error) {
        console.warn("Supabase insertNode failed, falling back to in-memory store", error);
        return inMemory.insertNode(payload);
      }
    },
    async insertChildren(payloads) {
      if (payloads.length === 0) return [];
      try {
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
      } catch (error) {
        console.warn("Supabase insertChildren failed, falling back to in-memory store", error);
        return inMemory.insertChildren(payloads);
      }
    },
    async deleteSession(id: string) {
      try {
        const { error } = await client.from("sessions").delete().eq("id", id);
        if (error) throw error;
      } catch (error) {
        console.warn("Supabase deleteSession failed, falling back to in-memory store", error);
        await inMemory.deleteSession(id);
      }
    }
  };
}

function normalizeSession(row: SessionRow): Session {
  return {
    id: row.id,
    title: row.title,
    shareToken: row.share_token,
    isPublic: row.is_public ?? true,
    createdAt: row.created_at,
    createdBy: row.created_by ?? null
  };
}

function normalizeNode(row: NodeRow): NodeRecord {
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

export const listSessions = () => adapter.listSessions();

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

export const deleteSession = (id: string) => adapter.deleteSession(id);
