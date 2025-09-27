# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Next.js App Router entries and API routes (`/api/session`, `/api/brainstorm`).
- `components/` contains interactive UI pieces such as `SessionView`, `GraphCanvas`, and `PromptBar`.
- `lib/` stores server utilities (`db.ts`, `gemini.ts`, `sanitize.ts`) and shared domain types in `types.ts`.
- `tests/` houses Vitest specs; mirror the source directory when adding new tests.
- Key config files live at the repo root (`tsconfig.json`, `eslint.config.mts`, `tailwind.config.ts`, `SUPABASE_SETUP.md`).

## Build, Test, and Development Commands
- `npm run dev` — start the Next.js dev server with hot reload.
- `npm run build` — generate the production bundle.
- `npm run start` — serve the last build locally.
- `npm run lint` — execute ESLint using the flat config (`eslint.config.mts`).
- `npm test` — run all Vitest suites.
- `npx tsc --noEmit` — perform a standalone type-check pass.

## Coding Style & Naming Conventions
- Use TypeScript, functional React components, and hooks-first patterns.
- Keep 2-space indentation and rely on Tailwind utility classes for styling.
- Component files use `PascalCase`, utility modules use `camelCase`, and route folders follow Next.js conventions.
- Run `npm run lint` before committing; it enforces the shared ESLint ruleset.

## Testing Guidelines
- Tests live under `tests/` and should mirror feature names (e.g., `tests/rateLimit.test.ts`).
- Use Vitest’s `describe/it` syntax and prefer `expect` assertions.
- Add regression tests for new API routes or Gemini adapters; run `npm test` locally before pushing.

## Commit & Pull Request Guidelines
- Follow conventional, present-tense commit messages (`feat: add session sidebar`, `fix: handle gemini fallback`).
- Ensure commits lint and type-check cleanly; include Supabase schema changes in `SUPABASE_SETUP.md` when relevant.
- Pull requests should describe the change, reference related issues, and attach screenshots or console logs for UI updates.
- Request reviews early for large features and note any follow-up tasks.

## Security & Configuration Tips
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` to client components; keep them server-side in `.env.local`.
- Update `SUPABASE_SETUP.md` after schema changes so teammates can sync quickly.
