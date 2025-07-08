# AI Brainstorming Chatbot Web App

This planning document outlines the project structure, key components, and development steps for building an AI brainstorming chatbot web app using the Gemini API. The chatbot returns multiple divergent responses to each user prompt and visualizes them in a mind‑map–style graph.

---

## 1. Purpose

The webapp is designed to help users generate ideas from multiple perspectives quickly. When a user submits a prompt, the backend calls the Gemini API several times in parallel to produce diverse responses. These responses are displayed as nodes connected to the original prompt, forming an interactive mind‑map that encourages exploration and creative thinking. Users can branch any node to continue ideation, ultimately building a rich, visual web of concepts.

---

## 2. Folder Structure (MVP)

```text
a-brainstorm-chatbot/
├── client/                # Single‑page React app
│   ├── public/            # index.html, favicon
│   └── src/
│       ├── components/    # GraphCanvas.tsx, PromptInput.tsx
│       ├── store/         # graphStore.ts (state management via Zustand or Context)
│       └── main.tsx       # SPA entry point
├── server/                # Minimal Node/Express API
│   ├── services/
│   │   ├── geminiService.ts
│   │   └── graphService.ts
│   └── index.ts           # Routes and server startup
├── shared/                # (optional) shared types/interfaces
├── .env.example           # Environment variable template
├── package.json
└── README.md
```

---

## 3. Core Features & Flow

1. **User Prompt** – User submits a brainstorming prompt in the UI.
2. **API Request** – Front‑end posts the prompt to `/api/brainstorm`.
3. **Manager‑Agent Stage** – Back‑end passes the prompt once to a *manager agent* (Gemini) that thinks of distinct "angles" (e.g., pro‑/con‑, metaphor, practical use‑case, moon‑shot idea). It returns a list of mini‑prompts, each describing a different approach.
4. **Worker‑Agents Stage** – For each mini‑prompt, the back‑end fires an independent *worker agent* call (parallel) to Gemini to generate a detailed response.
5. **Graph Construction** – Manager angles become first‑level child nodes; each worker response becomes a second‑level node beneath its angle, allowing clearer grouping in the mind‑map.
6. **Visualization** – Front‑end renders the interactive graph (zoom, pan, expand/collapse nodes).
7. **Session Management** – Persist sessions in memory or a lightweight database; allow users to revisit and branch any node (which re‑runs Manager → Worker flow for that node).

---

## 4. Technical Stack

- **Front‑end**: React (Vite or CRA), TypeScript, D3.js or React‑Flow for graph visualization.
- **Back‑end**: Node.js, Express, TypeScript.
- **AI API**: Gemini (REST or gRPC).
- **Data Store**: In‑memory (for MVP) or Redis / MongoDB for persistence.
- **Testing**: Jest, React Testing Library, Supertest.
- **Deployment**: Monolithic Docker container (Express serves static React build **and** API); deploy on Render, Fly.io, or a single VPS. No cross‑origin issues in production. environment variables store API keys.

---

## 5. Architecture & Key Modules

### 5.1 Front‑end

- **ChatService** – `POST /api/brainstorm` with `{ prompt, numVariants }`.
- **graphStore** – Central state container (Zustand or React Context) managing nodes, edges, and undo/redo.
- **Components**
  - `PromptInput` – Input box and variant‑count selector.
  - `GraphCanvas` – Renders the graph and handles interactions.

### 5.2 Back‑end

- **Routes** –
  - `POST /api/brainstorm` – new session.
  - `POST /api/branch` – add variants to an existing node.
- **Controller** – Validates input, orchestrates Manager → Worker flow.
- **ManagerService** – Single Gemini call that returns an array of `angles[]` (mini‑prompts + labels).
- **WorkerService** – Runs `Promise.all` of Gemini calls, one per angle, returning full responses.
- **GraphService** – Builds JSON structure:
  ```js
  {
    nodes: [ { id, text, parentId, label }, ... ],
    edges: [ { source, target }, ... ]
  }
  ```
  Root → angle nodes → response nodes.
- **SessionModel** – Holds sessions keyed by UUID; stores nodes and edges.

---

## 6. API Endpoints

| Method | Path               | Body                                      | Response                 |
| ------ | ------------------ | ----------------------------------------- | ------------------------ |
| POST   | `/api/brainstorm`  | `{ prompt: string, numVariants: number }` | `{ sessionId, graph }`   |
| GET    | `/api/session/:id` | —                                         | `{ sessionId, graph }`   |
| POST   | `/api/branch`      | `{ sessionId, nodeId, numVariants }`      | `{ newNodes, newEdges }` |

---

## 7. UI/UX Considerations

- **Mind‑map View** – Nodes are draggable; clicking expands children.
- **Variant Selection** – Range slider (2–5) lets users pick how many variants (worker agents) to spawn.
- **Loading States** – Skeleton nodes or a spinner while awaiting AI.
- **Error Handling** – Show user‑friendly messages on API failures.

---

---

## 8. Dev & Ops Notes

- **Dev CORS / Proxy** – In local dev, set up `vite.config.ts` proxy:
  ```ts
  export default defineConfig({
    server: {
      proxy: {
        '/api': 'http://localhost:3000' // Express server
      }
    }
  });
  ```
  or enable `cors()` middleware in Express.
- **Environment Variables** – `.env.example` should include:
  ```env
  GEMINI_API_KEY=
  GEMINI_MODEL_MANAGER=
  GEMINI_MODEL_WORKER=
  MAX_WORKERS_PER_PROMPT=5
  ```
- **Rate Limiting / Cost Guardrail** – Back‑end enforces `MAX_WORKERS_PER_PROMPT` (UI range 2–5) using a simple token‑bucket or per‑IP counter.
- **Monolithic Deploy** – Single Docker image bundles React build and API, simplifying hosting and eliminating CORS in production.

---

*Planning document generated for coding‑agent hand‑off.*\*

