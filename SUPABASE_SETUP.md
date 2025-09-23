# Supabase Setup Guide

This project can run entirely in memory, but the production workflow stores sessions and nodes in Supabase. Follow the steps below to provision a Supabase project, create the required tables, and connect the Next.js app.

## 1. Create and configure a Supabase project

1. Sign in at [supabase.com](https://supabase.com/) and create a new project.
2. Choose the **US-East** region (or any region close to your users) and set a strong database password. Keep it handy; Supabase uses it for raw SQL access.
3. Once the project finishes provisioning, open **Project Settings → API**. We will use the values under **Project URL** and **service_role key** later.

## 2. Create the database schema

Open the **SQL Editor** inside Supabase and run the following script. It creates the two tables used by the app and a helper view of the default row level security (RLS) policies.

```sql
-- Sessions created by the app.
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  share_token text not null unique,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid
);

-- Brainstorm nodes associated with a session.
create table if not exists public.nodes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  parent_id uuid REFERENCES public.nodes (id) on delete set null,
  persona text not null,
  content text not null,
  x numeric,
  y numeric,
  created_at timestamptz not null default now()
);

-- Useful index for fetching the tree for a given session.
create index if not exists nodes_session_id_idx on public.nodes (session_id);
```

### Row Level Security

The service role key bypasses RLS, so the code can insert and read rows even if policies are strict. If you plan to expose public APIs that rely on Supabase auth, keep RLS enabled and author policies accordingly. For the server-only usage in this project, it is acceptable to leave RLS on without adding policies.

## 3. Collect environment variables

Create a `.env.local` file (or update it if it already exists) with the following keys:

```bash
SUPABASE_URL="https://<your-project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service_role_key_from_project_settings>"
GEMINI_API_KEY="<optional-google-gemini-key>"
MODEL_NAME="gemini-1.5-pro"
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="30"
```

- `SUPABASE_URL` is the Project URL copied from **Settings → API**.
- `SUPABASE_SERVICE_ROLE_KEY` is the *service_role* key from the same page. **Do not** expose it to the browser; keep it on the server.
- The Gemini fields are optional. If you leave `GEMINI_API_KEY` empty, the app generates placeholder replies.

Restart `npm run dev` after updating environment variables so Next.js can pick them up.

## 4. Run migrations locally (optional but recommended)

Supabase’s SQL editor is convenient, but storing schema changes in the repo helps future teammates. Consider using the Supabase CLI:

```bash
# Install once
npm install --global supabase

# Authenticate
supabase login

# Initialize if the project does not have a supabase/ directory yet
supabase init

# Link to your cloud project
supabase link --project-ref <your-project-ref>

# Generate a migration from the SQL above
supabase migration new init-schema
# Paste the SQL into supabase/migrations/<timestamp>_init-schema.sql

# Apply it to your local database (if you use supabase start) or to the remote project
supabase db push
```

## 5. Verify the integration

1. Restart the dev server: `npm run dev`.
2. Open `http://localhost:3000`, create a brainstorm session, and ensure you are redirected to `/s/<shareToken>` without a 404.
3. In Supabase, open **Table Editor → sessions / nodes** to confirm the records appeared.

If you still see 404s when loading the share page:

- Double-check that the environment variables are available to the Next.js process (print them in the terminal if necessary).
- Confirm the `nodes` table rows reference the correct `session_id`.
- Inspect the server logs for warnings such as “Supabase … returned error, using in-memory store”; they indicate the adapter is still falling back to the in-memory implementation.

## 6. Deploy reminders

- Set the same environment variables in your hosting platform (Vercel, Netlify, etc.).
- Never ship the service role key to client-side JavaScript. All Supabase interactions in this repo happen inside API routes, so the key remains on the server.
- Rotate the service role key if it is ever exposed.

With these steps, the app will use Supabase for persistent storage rather than the temporary in-memory adapter.
