# AI Brainstormer

Mind-map brainstorming MVP built with Next.js, React Flow, Supabase and Gemini personas.

## Getting Started

1. Copy `.env.local.example` to `.env.local` and set Supabase and Gemini credentials.
2. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

3. Create the database tables using the SQL in `Spec.md`.

Visit `http://localhost:3000` to create a brainstorming session.

## Testing

```bash
npm test
```

Vitest covers layout and rate limiting helpers.
