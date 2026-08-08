# Supabase setup

No Supabase project is linked yet — `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset (see `.env.example`), and the app
runs entirely on the local seed data in `src/data/lessons` until they're
provided. Nothing here is applied automatically.

## Applying the schema

Once a project exists:

1. Copy `.env.example` to `.env.local` and fill in the project URL + anon key
   from Project Settings → API.
2. Apply `migrations/20250101000000_init_schema.sql`, either via the
   Supabase CLI (`supabase link` then `supabase db push`) or by pasting it
   into the project's SQL editor.
3. Seed `levels` / `lessons` / `sentences` from `src/data/lessons` — the
   lesson and sentence ids there (e.g. `normal-1`, `normal-1-s1`) are plain
   text slugs chosen to match the schema's primary keys 1:1, so the existing
   seed can be inserted as-is.

Once both env vars are set, `src/lib/supabase/config.ts`'s
`isSupabaseConfigured()` flips to `true` and `src/lib/content.ts` starts
reading lessons from Supabase instead of the local seed — no other code
changes needed.

Progress (`user_progress`, `streaks`) stays on the local `localStorage` store
until an authentication flow exists to provide a real `user_id`; see the
comments in `src/lib/supabase/queries/progress.ts`.
