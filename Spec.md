## 0) TL;DR

* **Goal:** Mind‑map brainstorming where each user prompt fans out to **Optimist / Pessimist / Realist** replies.
* **Stack:** Next.js (App Router) + React Flow + Supabase (Postgres) + Gemini.
* **MVP rules:** Single repo, API routes (no queues), non‑streaming LLM calls, **edges computed from parentId** (no edges table), optional auth, share‑link editing.

---

## 1) Functional Requirements

**Core**

1. User enters prompt → backend fans out to 3 Gemini personas → 3 child replies.
2. Graph view: zoom/pan, select node, expand/collapse subtrees.
3. Follow‑up: select any node → add follow‑up prompt → fan‑out again under that node.
4. Sessions persist by `sessionId`; shareable via `shareToken` link; reload shows the full tree.

**MVP Constraints**

* Non‑streaming; return once all persona calls settle.
* Anonymous usage allowed; share link grants edit (simplest).
* No realtime multi‑cursor; refresh or client state is enough.
* **Rate limit** per IP/session to avoid runaway graphs.

---

## 2) Non‑Functional Requirements

* **Performance:** P95 API < 3s for fan‑out (LLM latency dominates). Soft cap **≤ 500 nodes/session**.
* **Availability:** Single region OK (Vercel + Supabase hosted).
* **Security/Privacy:** No PII by default; sanitize user-rendered text. Secrets only on server.
* **Cost:** 3 LLM calls per user action; cap requests (e.g., 200/day/IP) in MVP.

---

## 3) High‑Level Architecture

```
[Browser UI]
  |    ^                  Zoom/Pan/Select/Submit
  v    |
[Next.js App]
  ├─ /api/session        (create/load by id or shareToken)
  └─ /api/brainstorm     (insert user node, fanout Gemini, insert children)
        |
        v
 [Gemini API]  (3 parallel calls with system prompts)
        |
        v
 [Supabase Postgres]  (sessions, nodes)
```

**Data flow (new prompt / follow‑up):**

1. Client → POST `/api/brainstorm` `{ sessionId, prompt, parentNodeId? }`
2. Server inserts **user node**, calls 3 personas in parallel (`Promise.allSettled`)
3. Server inserts successful persona nodes as children
4. Server → Client returns `{ userNode, children[] }`, client merges into React Flow

---

## 4) Project Structure (single repo)

```
/ (Next.js + TS + React Flow)
├─ app/
│  ├─ page.tsx                 # home: create session
│  ├─ s/[shareToken]/page.tsx  # session page (viewer/editor)
│  └─ api/
│     ├─ session/route.ts      # POST(create), GET(load by ?id or ?token)
│     └─ brainstorm/route.ts   # POST fan-out endpoint
├─ components/
│  ├─ GraphCanvas.tsx
│  ├─ NodeRenderer.tsx
│  └─ PromptBar.tsx
├─ lib/
│  ├─ db.ts                    # Supabase server client
│  ├─ types.ts                 # shared types
│  ├─ layout.ts                # simple tree layout helpers
│  ├─ sanitize.ts              # HTML/markdown sanitize (MVP)
│  ├─ rateLimit.ts             # basic IP/session limiter
│  └─ gemini.ts                # persona prompts & LLM call wrapper
├─ prisma/ or sql/             # (optional) migrations; using raw SQL below
├─ tests/                      # unit/api tests (Vitest)
├─ .env.local.example
└─ README.md
```

---

## 5) Environment & Config

**Runtime:** Node 18+, Next.js (App Router), TypeScript strict.

**Env variables (server‑only)**

* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY` *(server only; never to client)*
* `GEMINI_API_KEY`
* `MODEL_NAME` (e.g., `gemini-1.5-pro`)

**Public env (optional)**

* *None required for MVP.* (We route all DB access through API.)

---

## 6) Database Schema (Postgres via Supabase)

> MVP stores **only nodes** and **sessions**. Edges are **derived** from `parent_id`.

```sql
-- sessions: one per brainstorming tree
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_by uuid,               -- nullable in MVP (anonymous)
  is_public boolean not null default true,      -- shareable link grants view/edit in MVP
  share_token text unique not null,             -- short id/ulid
  created_at timestamptz not null default now()
);

-- enum for personas
do $$
begin
  if not exists (select 1 from pg_type where typname = 'persona') then
    create type persona as enum ('user', 'optimist', 'pessimist', 'realist');
  end if;
end$$;

-- nodes: hierarchical conversation
create table if not exists nodes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  parent_id uuid references nodes(id) on delete cascade,
  persona persona not null,
  content text not null,            -- plain/markdown (will be sanitized on render)
  x double precision,               -- optional persisted layout (MVP can be null)
  y double precision,
  created_at timestamptz not null default now()
);

create index if not exists idx_nodes_session_parent on nodes(session_id, parent_id);
create index if not exists idx_nodes_session_created on nodes(session_id, created_at desc);
```

**RLS (optional in MVP):**
If all DB access is through API using **service role**, RLS can remain enabled but effectively bypassed by server. For future user auth, enable RLS policies by owner or via `share_token`.

---

## 7) Shared TypeScript Types (`lib/types.ts`)

```ts
export type Persona = 'user' | 'optimist' | 'pessimist' | 'realist';

export interface Session {
  id: string;
  title: string | null;
  shareToken: string;
  isPublic: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface GraphNode {
  id: string;
  sessionId: string;
  parentId: string | null;
  persona: Persona;
  content: string;
  x?: number | null;
  y?: number | null;
  createdAt: string;
}

export interface BrainstormRequest {
  sessionId: string;
  prompt: string;
  parentNodeId?: string | null;
}

export interface BrainstormResponse {
  userNode: GraphNode;
  children: GraphNode[]; // up to 3 (optimist/pessimist/realist)
}
```

---

## 8) API Contract

### `POST /api/session`

* **Body:** `{ title?: string }`
* **Response:** `{ session: Session }` with generated `shareToken`.

### `GET /api/session`

* **Query:** `?id=<uuid>` **or** `?token=<shareToken>`
* **Response:**

  ```json
  {
    "session": { "id": "...", "title": "...", "shareToken": "...", "isPublic": true },
    "nodes": [ /* GraphNode[] */ ]
  }
  ```
* **Behavior:** If `token` matches and `isPublic = true`, return the session; otherwise 403/404.

### `POST /api/brainstorm`

* **Body:** `BrainstormRequest`
* **Behavior:**

  * Insert **user** node under `parentNodeId` (or root).
  * Fan‑out to 3 personas in parallel; collect fulfilled; insert each child.
  * Return inserted nodes (no edges; client derives edges from `parentId`).
* **Response:** `BrainstormResponse`
* **Errors:**

  * `400` invalid input
  * `403` forbidden (non‑public session, future auth)
  * `404` session not found
  * `429` rate limited
  * `500` internal

> **Rate limits (MVP):** e.g., **30** brainstorm requests / hour / IP and **5/sec burst 3** per session.

---

## 9) Persona Prompts (server‑side constants)

```ts
export const PERSONA_SYSTEM: Record<Exclude<Persona,'user'>, string> = {
  optimist:  "You are the Optimist. Assume best-case scenarios and highlight bold opportunities. Be concise and concrete.",
  pessimist: "You are the Pessimist. Surface risks, pitfalls, and worst-case outcomes first. Be specific and practical.",
  realist:   "You are the Realist. Project the most likely scenario, balancing pros and cons. Provide actionable next steps."
};

// User content always: the user's prompt string.
// Optionally prepend brief context about the selected parent node in follow-ups, e.g.:
export const FOLLOWUP_PREFIX =
  "Context: You are replying under a specific branch of a brainstorming tree.\n" +
  "Stay consistent with your persona and respond concisely.\n";
```

**LLM call parameters (suggested):**

* `model`: `process.env.MODEL_NAME || 'gemini-1.5-pro'`
* `temperature`: 0.7 (optimist), 0.3 (pessimist), 0.5 (realist)
* `maxOutputTokens`: \~512
* Timeout per call: 12s; overall request budget: 18–25s.

---

## 10) Backend Implementation Notes

**`/api/brainstorm` high‑level (TypeScript pseudocode)**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { insertNode, getSessionById, insertNodes } from '@/lib/db';
import { callGemini } from '@/lib/gemini';
import { limit } from '@/lib/rateLimit';
import { sanitizePlain } from '@/lib/sanitize';

const Body = z.object({
  sessionId: z.string().uuid(),
  prompt: z.string().min(1).max(2000),
  parentNodeId: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  await limit(req, { key: 'brainstorm', windowSec: 3600, max: 30 }); // simple IP bucket
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  const { sessionId, prompt, parentNodeId } = parsed.data;

  const session = await getSessionById(sessionId);
  if (!session || !session.isPublic) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const cleanPrompt = sanitizePlain(prompt);

  const userNode = await insertNode({
    sessionId, parentId: parentNodeId ?? null, persona: 'user', content: cleanPrompt
  });

  const personas = (['optimist','pessimist','realist'] as const);
  const calls = personas.map(p =>
    callGemini({ persona: p, prompt: cleanPrompt }).then(text => ({ persona: p, text }))
  );

  const settled = await Promise.allSettled(calls);
  const children = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') {
      const content = sanitizePlain(r.value.text ?? '');
      if (content) {
        const child = await insertNode({
          sessionId, parentId: userNode.id, persona: r.value.persona, content
        });
        children.push(child);
      }
    }
  }

  return NextResponse.json({ userNode, children });
}
```

**DB helpers:** Use server‑side Supabase client with **service role**.

**Error handling:**

* If all three persona calls fail, return user node + empty children + warning message.
* Log persona failures (no PII).

---

## 11) Frontend Implementation Notes

**Pages**

* `/` — “New Session” button; POST `/api/session`; redirect to `/s/[shareToken]`.
* `/s/[shareToken]` — loads session via `GET /api/session?token=...`, renders `GraphCanvas`, `PromptBar`.

**`GraphCanvas` (React Flow)**

* Build nodes from `GraphNode[]`

  * Each `GraphNode` → React Flow `Node` with `id`, `data: { content, persona }`, and style by persona.
* **Edges:** derive at render: for each node with `parentId`, make edge `{ id: p->n, source: parentId, target: id }`.
* **Expand/Collapse:** maintain `collapsed: Set<string>`; when collapsed, hide descendants in filtered view.
* **Layout:** simple tree layout utility (`lib/layout.ts`):

  * BFS by depth; assign `x = depth * 400`, `y = rowIndex * 140`.
  * Optionally persist back `x,y` after drag (debounced PATCH in future; skip in MVP).

**Persona color palette (MVP)**

* user: gray; optimist: green; pessimist: red; realist: blue.

**Follow‑up UX**

* Click a node → highlighted; `PromptBar` shows “Reply under: \[snippet…]”
* Submit → POST `/api/brainstorm` with `parentNodeId = selected.id`; merge return payload.

---

## 12) Sanitization & Rendering

* Render `content` as plain text or **sanitized markdown**.
* Use a simple sanitizer (e.g., remove `<script>`, inline event handlers). For MVP, **escape HTML** and allow limited markdown (bold, lists, code).
* Hard cap content length (e.g., 2,000 chars prompt, 2,000 chars response).

---

## 13) Rate Limiting & Guards

* **Per IP**: 30 requests/hour to `/api/brainstorm` (configurable).
* **Per session**: 5 req/min burst 3.
* **Graph cap**: deny once `count(nodes where sessionId=...) > 500`.
* **LLM backoff**: if 429 from Gemini, retry each persona once with jitter; otherwise drop that persona for this call.

---

## 14) Testing Plan (MVP)

* **Unit (Vitest):**

  * `layout.ts` produces stable coordinates.
  * `sanitize.ts` removes scripts/inline handlers.
  * `rateLimit.ts` enforces windows.
* **API (integration):**

  * Create session → 200, returns shareToken.
  * Brainstorm (root) → returns 1 user node + ≤3 children.
  * Brainstorm (follow‑up) → children attach to selected parent.
  * Rate limit → 429 after threshold.
* **UI (smoke):**

  * Load session, render nodes/edges, collapse/expand toggles.

---

## 15) Deployment

* **Next.js** → Vercel (Node runtime); set server env vars.
* **Supabase** → hosted project; run SQL migration once.
* **Domains** → optional custom domain.
* **Observability** → Vercel logs; Supabase logs; simple `console.error` on LLM failures.

---

## 16) Risks & Mitigations

* **LLM latency** → parallelize (done), low `maxTokens`, sensible timeouts.
* **Cost blow‑ups** → rate limits, node cap, short outputs.
* **XSS** → sanitize/escape outputs (done).
* **Abuse** → optional hCaptcha on `/api/brainstorm` (v2).

---

## 17) Future (Out of MVP)

* Streaming tokens; optimistic child placeholders.
* Supabase Realtime for collaborative viewing.
* Auth + private sessions + RLS policies by `created_by`.
* Edge layout (ELK/dagre) and layout persistence.
* Export/share as PNG/JSON.
* More personas, toggleable.

---

## 18) Example API Payloads

**Create session**

```
POST /api/session
{ "title": "Startup Ideas" }

200
{
  "session": {
    "id": "c8f...e6",
    "title": "Startup Ideas",
    "shareToken": "abC123xy",
    "isPublic": true,
    "createdAt": "2025-09-22T18:03:11Z",
    "createdBy": null
  }
}
```

**Brainstorm under root**

```
POST /api/brainstorm
{
  "sessionId": "c8f...e6",
  "prompt": "How could we use on-device ML for note-taking?",
  "parentNodeId": null
}

200
{
  "userNode": { "id": "...", "persona": "user", "content": "...", "parentId": null, ... },
  "children": [
    { "id": "...", "persona": "optimist", "parentId": "<userNodeId>", "content": "..." },
    { "id": "...", "persona": "pessimist", "parentId": "<userNodeId>", "content": "..." },
    { "id": "...", "persona": "realist",  "parentId": "<userNodeId>", "content": "..." }
  ]
}
```

---

## 19) Minimal SQL Migration (paste once in Supabase SQL editor)

```sql
-- enable extension for UUIDs if needed
create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_by uuid,
  is_public boolean not null default true,
  share_token text unique not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'persona') then
    create type persona as enum ('user','optimist','pessimist','realist');
  end if;
end$$;

create table if not exists nodes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  parent_id uuid references nodes(id) on delete cascade,
  persona persona not null,
  content text not null,
  x double precision,
  y double precision,
  created_at timestamptz not null default now()
);

create index if not exists idx_nodes_session_parent on nodes(session_id, parent_id);
create index if not exists idx_nodes_session_created on nodes(session_id, created_at desc);
```

---

## 20) Acceptance Criteria (MVP)

* Creating a session yields a URL `/s/[shareToken]`.
* On that page, entering a prompt displays the user node and up to three persona replies as children, color‑coded.
* Selecting any node and entering a follow‑up creates a new branch with three children.
* Reloading the page shows the persisted tree.
* Basic rate limiting works; excessive usage returns `429`.
* No raw HTML is injected in the UI (sanitization evident).