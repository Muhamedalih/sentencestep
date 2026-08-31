-- XP, daily learning goal, and a per-attempt history table (Premium
-- enhancement milestone). All three follow the exact owner-only RLS shape
-- already used by streaks/user_progress (20250101000000_init_schema.sql):
-- `for all using (auth.uid() = user_id) with check (auth.uid() = user_id)`.
--
-- Learner "level" is intentionally *not* a column here — it's always derived
-- from total XP by src/lib/progress/learner-level.ts, so adding more tiers
-- later never needs a migration. XP itself lives in its own table rather
-- than a `profiles` column so it doesn't interact with
-- 20250111000000_lock_profile_role_column.sql's column-grant allowlist.

-- One row per user: a running XP total, recomputed server-side on every
-- lesson completion (see src/lib/progress/actions.ts) — never accepted
-- directly from the client.
create table user_xp (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- One row per (user, local calendar day): how many sentences were completed
-- that day against that day's goal. Distinct from streaks (which only
-- tracks whether a day was active) because "how much" needs its own detail
-- streaks was never designed to hold.
create table daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  sentences_completed integer not null default 0 check (sentences_completed >= 0),
  goal integer not null default 5 check (goal > 0),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Append-only per-lesson-attempt history: the foundation for future adaptive
-- difficulty (surfacing struggle words/sentences again) and the first place
-- WPM is ever persisted (previously computed live and discarded — see
-- src/hooks/use-typing-engine.ts). Deliberately does not touch the existing
-- user_progress table, which intentionally collapses to one row per lesson
-- (latest attempt only) and isn't suited to attempt-level history.
create table lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references lessons (id) on delete cascade,
  mode learning_mode not null,
  accuracy numeric(4, 3) check (accuracy >= 0 and accuracy <= 1),
  wpm integer check (wpm >= 0),
  created_at timestamptz not null default now()
);

create index daily_progress_user_id_idx on daily_progress (user_id);
create index lesson_attempts_user_id_idx on lesson_attempts (user_id);
create index lesson_attempts_lesson_id_idx on lesson_attempts (lesson_id);

alter table user_xp enable row level security;
alter table daily_progress enable row level security;
alter table lesson_attempts enable row level security;

create policy "Users manage their own xp" on user_xp
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own daily progress" on daily_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own lesson attempts" on lesson_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
