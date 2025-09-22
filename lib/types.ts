export type Persona = "user" | "optimist" | "pessimist" | "realist";

export interface Session {
  id: string;
  title: string | null;
  shareToken: string;
  isPublic: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface NodeRecord {
  id: string;
  sessionId: string;
  parentId: string | null;
  persona: Persona;
  content: string;
  x: number | null;
  y: number | null;
  createdAt: string;
}

export interface SessionWithNodes {
  session: Session;
  nodes: NodeRecord[];
}

export interface BrainstormRequestBody {
  sessionId: string;
  prompt: string;
  parentNodeId?: string | null;
}

export interface BrainstormResponseBody {
  userNode: NodeRecord;
  children: NodeRecord[];
}
