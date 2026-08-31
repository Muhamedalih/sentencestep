-- App-level brute-force protection on password sign-in, on top of whatever
-- Supabase Auth's own endpoint rate limits already provide (those are
-- project-wide and not tunable from migrations) — requested explicitly
-- after the audit flagged that login had no lockout of its own at all.
--
-- Service-role-only by design: no RLS policy exists for any role here at
-- all (not even `authenticated`), so the anon/authenticated Postgres roles
-- can never read or write a single row through PostgREST — this table is
-- purely an internal signal for src/lib/supabase/auth-actions.ts's signIn,
-- read and written exclusively via the service-role client, the same
-- reasoning src/lib/supabase/service-role.ts already documents for the
-- other server-only ledgers (webhook processing, notification events).
begin;

create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  -- Normalized lowercase — the same identity signInWithPassword itself is
  -- keyed on, so a lockout can't be trivially dodged by case variation.
  email text not null,
  success boolean not null,
  created_at timestamptz not null default now()
);

-- The one query this table exists to serve: "how many recent failures for
-- this email" — created_at DESC so a LIMIT-bounded recency check never has
-- to scan the whole table as it grows.
create index login_attempts_email_created_at_idx on login_attempts (email, created_at desc);

alter table login_attempts enable row level security;

commit;
