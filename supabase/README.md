# Supabase setup

No Supabase project is linked yet — `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset (see `.env.example`), and the app
runs entirely on the local seed data in `src/data/lessons` until they're
provided. Nothing here is applied automatically.

## Applying the schema

Once a project exists:

1. Copy `.env.example` to `.env.local` and fill in the project URL + anon key
   from Project Settings → API.
2. Apply both migrations, in order — either via the Supabase CLI
   (`supabase link` then `supabase db push`) or by pasting each into the
   project's SQL editor:
   - `migrations/20250101000000_init_schema.sql` — content + per-user tables
     and their RLS policies.
   - `migrations/20250102000000_handle_new_user.sql` — a trigger that
     creates a `profiles` row automatically whenever someone signs up.
3. Seed `levels` / `lessons` / `sentences` from `src/data/lessons` — the
   lesson and sentence ids there (e.g. `normal-1`, `normal-1-s1`) are plain
   text slugs chosen to match the schema's primary keys 1:1, so the existing
   seed can be inserted as-is.
4. In the Supabase dashboard, under Authentication → Providers → Email,
   decide whether "Confirm email" is enabled. The app handles either setting
   correctly (see below) — this isn't something the code or migrations
   control.

Once both env vars are set, `src/lib/supabase/config.ts`'s
`isSupabaseConfigured()` flips to `true`:

- `src/lib/content.ts` starts reading lessons from Supabase instead of the
  local seed.
- `/login` and `/register` switch from a "not configured" notice to real
  sign-in/sign-up forms (`src/lib/supabase/auth-actions.ts`), and
  `src/middleware.ts` starts refreshing the session on every request.
- Signed-in learners' progress (`user_progress`, `streaks`) is read and
  written through `src/lib/progress/actions.ts` instead of localStorage —
  see `src/hooks/use-progress.ts` for the branch. Guests (no account, or no
  Supabase project linked) keep using the local store exactly as before;
  free lessons never require an account.

If "Confirm email" is enabled in the Supabase project, `signUp` returns a
user but no session — the register form shows a "check your email" message
instead of redirecting in, and the confirmation link routes through
`src/app/auth/callback/route.ts` to exchange the code for a real session.
If it's disabled, signup logs the learner in immediately.
