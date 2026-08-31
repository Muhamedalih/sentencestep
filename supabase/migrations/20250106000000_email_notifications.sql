-- Milestone 9: email preferences + notification event log.
--
-- No email provider is connected yet. This only prepares the schema:
-- per-user preferences for the two optional email categories, an
-- idempotency ledger so the same milestone never emails a user twice, and
-- the smallest possible foundation for timezone-aware reminders later.

alter table profiles
  add column if not exists timezone text;

-- Learning reminders and progress/milestone emails are the only two
-- optional categories (see src/lib/email/preferences.ts) — essential
-- account/security email (signup confirmation, password reset) is handled
-- entirely by Supabase Auth itself and is never gated by this table, so it
-- can't accidentally be treated as an optional marketing email.
create table email_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  learning_reminders boolean not null default true,
  progress_emails boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_preferences enable row level security;

create policy "Users manage their own email preferences" on email_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Idempotency ledger for notification events (LESSON_COMPLETED,
-- LEVEL_COMPLETED, STREAK_MILESTONE, ...) — see src/lib/email/events.ts.
-- The unique constraint is what makes re-processing the same milestone for
-- the same user a no-op instead of a duplicate email. Not user-readable:
-- only ever written by server-side code using the service-role client,
-- same posture as billing_events from Milestone 8.
create table notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  dedupe_key text not null,
  payload jsonb not null,
  email_status text not null default 'skipped' check (email_status in ('queued', 'sent', 'skipped')),
  created_at timestamptz not null default now(),
  unique (user_id, type, dedupe_key)
);

alter table notification_events enable row level security;

create index notification_events_user_id_idx on notification_events (user_id);

-- Every new user now also gets a default email_preferences row alongside
-- their profile and subscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'free');

  insert into public.email_preferences (user_id)
  values (new.id);

  return new;
end;
$$;
