# AI Brainstormer

Mind-map brainstorming MVP built with **Next.js 15**, **React Flow**, **Supabase**, and **Google Gemini** personas. The app renders conversation trees in the browser, persists sessions in Supabase, and fans out prompts to Optimist/Pessimist/Realist agents.

## Tech Stack at a Glance
- **Next.js App Router** (`app/`) for routing, server actions, and API handlers.
- **React Flow** (`components/GraphCanvas.tsx`) to visualize persona nodes and edges.
- **Supabase** (`lib/db.ts`) for session persistence; see `SUPABASE_SETUP.md` for schema details.
- **Gemini API** (`lib/gemini.ts`) to generate persona replies with graceful fallbacks.
- **Tailwind CSS** for styling and **Vitest** for unit tests.

## Project Structure
- `app/page.tsx` — session creation form (client component).
- `app/api/*` — API routes for sessions and brainstorming.
- `app/s/[shareToken]` — shared session view with React Flow canvas.
- `components/` — UI primitives (canvas, prompt bar, node renderer).
- `lib/` — data access, layout math, sanitization, rate limiting.
- `tests/` — Vitest suites covering layout and rate-limiter logic.

## Getting Started

1. Copy `.env.local.example` to `.env.local`, then follow **`SUPABASE_SETUP.md`** to provision the Supabase project and populate `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and related settings.
2. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Visit `http://localhost:3000` to create a session. Share links (`/s/<token>`) open the saved brainstorming tree.

## Testing & Quality

```bash
npm run lint   # ESLint (flat config)
npm run test   # Vitest suites (layout, rate limit, db helpers)
```

CI expects both commands to pass before merging. Add or update tests when modifying lib helpers or API handlers.

