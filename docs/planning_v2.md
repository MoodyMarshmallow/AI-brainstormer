# Forum – AI Brainstorming Chatbot (MVP)

This planning document describes **Forum**, a single‑page web app that visualises AI‑generated ideas as an interactive mind‑map. Every user prompt is answered by **three fixed Gemini personalities** — **Optimist**, **Pessimist**, and **Realist** — whose replies grow the graph outward.

---

## 1. Purpose

*Forum* helps users explore ideas from contrasting angles.

1. The user types a prompt ➜ it appears as a root node.
2. **Optimist** (ideal‑case), **Pessimist** (risk‑first), and **Realist** (pragmatic) respond in parallel.
3. Their replies become child nodes.
4. The user may click any response, ask a follow‑up, and the trio responds again—building a branching conversation tree.

---

## 2. Folder Structure (MVP)

```text
forum/
├── client/                # React SPA
│   ├── public/            # index.html, favicon
│   └── src/
│       ├── components/    # GraphCanvas.tsx, PromptInput.tsx
│       ├── store/         # graphStore.ts (Zustand)
│       └── main.tsx       # SPA entry
├── server/                # Node/Express API
│   ├── services/
│   │   ├── geminiService.ts
│   │   └── graphService.ts
│   └── index.ts           # Routes & startup
├── shared/                # (optional) shared types/interfaces
├── .env.example           # Env‑var template
├── package.json
└── README.md
```

---

## 3. Core Features & Flow

1. **User Prompt** – User enters a brainstorming question or idea in the prompt box.
2. **API Request** – The front‑end sends `POST /api/brainstorm` with `{ prompt }` to the back‑end.
3. **Parallel Gemini Calls** – The back‑end forwards the prompt to **three Gemini instances in parallel**, each initialised with a distinct system prompt that emulates one of the fixed personalities:
   - **Optimist** – “Assume the best‑case scenario and highlight bold opportunities.”
   - **Pessimist** – “Surface risks, pitfalls, and worst‑case outcomes first.”
   - **Realist** – “Project the most likely scenario, balancing pros and cons.”
4. **Graph Construction** – Each personality’s reply is added as a child node of the original user prompt, labelled by persona (colour‑coded in the UI).
5. **Visualization** – The front‑end renders the evolving mind‑map in `GraphCanvas`, supporting zoom, pan, and node expand/collapse.
6. **Branching / Follow‑ups** – The user selects any response node, types a follow‑up question, and submits. The follow‑up becomes a child node of the selected response. The back‑end then dispatches this follow‑up to the three personalities in parallel, and their replies become children of the follow‑up—preserving the hierarchy.
7. **Session Management** – The entire graph is stored in memory (or a lightweight DB) under a `sessionId`, allowing users to reload or share their brainstorming tree.

---

## 4. Technical Stack

- **Front‑end**: React 18 + Vite, TypeScript, React‑Flow, Tailwind CSS.
- **Back‑end**: Node 20, Express, TypeScript.
- **AI API**: Google Gemini (`gemini‑1.5‑pro`).
- **Data Store**: In‑memory (MVP) → Redis later.
- **Testing**: Jest, React Testing Library, Supertest.
- **Deployment**: Monolithic Docker container (Express serves static React build *and* API) on Render/Fly/VPS.

---

## 5. Architecture & Key Modules

### 5.1 Front‑end

- **ChatService** – `POST /api/brainstorm` for the first prompt and `POST /api/branch` for follow‑ups.
- **graphStore** – Global store of nodes, edges, `selectedNodeId`, undo/redo.
- **Components**
  - `PromptInput` – Input box fixed at bottom; shows “Follow‑up to… ” when a node is selected.
  - `GraphCanvas` – Renders the graph, handles selection, pan/zoom.

### 5.2 Back‑end

- **Routes**
  - `POST /api/brainstorm` – new session.
  - `POST /api/branch` – add follow‑up to existing node.
- **Controller** – Validates input, decides initial vs follow‑up, invokes `PersonalityService`, builds graph.
- **PersonalityService** – Hard‑coded array:
  ```ts
  export const PERSONAS = [
    { name: 'optimist', systemPrompt: 'Assume the best possible outcome; highlight bold opportunities.' },
    { name: 'pessimist', systemPrompt: 'Focus on risks, pitfalls, and failure modes first.' },
    { name: 'realist',  systemPrompt: 'Project the most likely scenario, balancing pros and cons.' }
  ];
  ```
  Sends three parallel Gemini calls.
- **GraphService** – Normalises responses into:
  ```ts
  type Node = { id: string; text: string; parentId?: string; persona?: 'optimist'|'pessimist'|'realist' };
  type Edge = { source: string; target: string };
  ```
- **SessionModel** – `Map<sessionId, { nodes: Node[]; edges: Edge[] }>` for MVP.

---

## 6. API Endpoints

| Method | Path               | Body                                          | Response                 |
| ------ | ------------------ | --------------------------------------------- | ------------------------ |
| POST   | `/api/brainstorm`  | `{ prompt: string }`                          | `{ sessionId, graph }`   |
| GET    | `/api/session/:id` | —                                             | `{ sessionId, graph }`   |
| POST   | `/api/branch`      | `{ sessionId, parentNodeId, prompt: string }` | `{ newNodes, newEdges }` |

---

## 7. UI/UX Notes

- **Node Labels** – Colour‑code by persona (green Optimist, red Pessimist, grey Realist).
- **Loading** – Show phantom child nodes with spinner icons until replies arrive.
- **Error Handling** – If a persona call fails, display a placeholder node with an error icon.

---

## 8. Dev & Ops

- **Local Dev Proxy** – `vite.config.ts` proxies `/api` to `http://localhost:3000`.
- **Env Vars (**``**)**
  ```env
  GEMINI_API_KEY=
  RATE_LIMIT_WINDOW=1m     # rolling window
  RATE_LIMIT_MAX=60        # max requests per IP per window
  ```
- **Docker** – Multi‑stage build: `npm run build` (client) then copy `dist/` into the final Express image.

### 8.1 Security & Rate Limiting

| Concern              | Mitigation                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Abuse / DoS**      | Use `express-rate-limit` with `RATE_LIMIT_WINDOW`/`RATE_LIMIT_MAX` (e.g., 60 req/min per IP) and a global cap on total Gemini calls per session.                 |
| **Prompt Injection** | Strip and log user input, escape HTML in front‑end rendering, and prepend system prompts that instruct models to ignore user attempts to alter persona behavior. |
| **CORS**             | Allow only your production origin in `cors()` middleware; deny all others.                                                                                       |
| **API Key Leakage**  | Store `GEMINI_API_KEY` only in server‑side env; never expose to client bundle.                                                                                   |
| **Output Size**      | Set a response size limit (e.g., 64 KB) and truncate over‑long Gemini replies.                                                                                   |
|                      |                                                                                                                                                                  |

---

*Planning document generated for coding‑agent hand‑off.*

