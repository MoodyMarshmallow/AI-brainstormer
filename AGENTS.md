# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the app router. Key routes include `app/page.tsx` (session creation UI), `app/api/*` (server actions + REST handlers), and `app/s/[shareToken]` (shared brainstorm view).
- `components/` holds reusable client components such as `GraphCanvas.tsx`, `SessionView.tsx`, and prompt controls. Treat files here as pure UI and inject data via props.
- `lib/` groups back-end utilities: Supabase access (`db.ts`), Gemini calls (`gemini.ts`), rate limiting, layout helpers, and sanitization. Shared types live under `types/`.
- `tests/` stores Vitest specs. Styling assets are in `app/globals.css` and `tailwind.config.ts`.

## Build, Test, and Development Commands
- `npm run dev` — start the Next.js dev server (Turbopack) at `http://localhost:3000`.
- `npm run build` — produce the production bundle. Run `npm run start` afterwards to smoke-test the output.
- `npm run lint` — execute ESLint using the flat config (`eslint.config.mts`). Resolve all errors before committing.
- `npm run test` — run the Vitest suite once; `npx vitest --watch` is handy while iterating on `lib/` helpers.

## Coding Style & Naming Conventions
- TypeScript is required. Maintain 2-space indentation, trailing commas, and `PascalCase` component filenames. Hooks and utilities stay `camelCase`.
- Keep Tailwind classes inline in JSX, ordering layout → spacing → color utilities for readability.
- ESLint (TypeScript + React) is the source of truth; avoid disabling rules unless you document the rationale inline.

## Testing Guidelines
- Name tests `*.test.ts` in `tests/` and mirror the directory of the code under test when practical.
- Use Vitest mocks (`vi.mock`, `vi.spyOn`) to isolate Supabase, Gemini, and timer behaviour. Prefer fast unit tests over slow integration runs.
- Add or update tests whenever you touch `lib/` or API routes; CI must pass `npm run test` without `--runInBand` tweaks.

## Commit & Pull Request Guidelines
- Write imperative commit subjects, e.g., `Add sidebar session list`. Group related changes into a single commit.
- Before pushing, run `npm run lint && npm run test`. Mention any intentionally skipped checks in the PR description.
- PRs should link issues, describe behaviour changes, and include screenshots or short clips for UI updates. Note migrations or Supabase schema edits explicitly.

## Configuration & Security Notes
- Copy `.env.local.example` to `.env.local`, then set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and related settings. Never commit secrets.
- Follow `SUPABASE_SETUP.md` when adjusting database structure. Document schema diffs and backfill steps in your PR to keep reviewers aligned.
