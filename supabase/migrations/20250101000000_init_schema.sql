-- Looma initial schema: learning content + per-user progress.
--
-- Content tables (levels, lessons, sentences) are public-read and mirror the
-- shape of the local dev seed in src/data/lessons — lesson/sentence ids are
-- plain text slugs (e.g. "normal-1", "normal-1-s1") so the existing seed data
-- can be imported 1:1 once this schema is applied to a real project.
--
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL
-- editor of a linked project. Not run automatically — no project is linked
-- yet.

create extension if not exists "pgcrypto";

create type learning_mode as enum ('normal', 'stories', 'conversation');
create type subscription_status as enum ('free', 'trialing', 'active', 'canceled', 'past_due');

-- Levels group lessons by difficulty tier within a mode.
create table levels (
  id uuid primary key default gen_random_uuid(),
  mode learning_mode not null,
  index integer not null,
  title text not null,
  title_ar text not null,
  created_at timestamptz not null default now(),
  unique (mode, index)
);

create index levels_mode_idx on levels (mode);

-- A lesson is one typing unit: a single sentence in "normal" mode, or a full
-- story/conversation (paired with its sentences) in the other modes.
create table lessons (
  id text primary key,
  mode learning_mode not null,
  level_id uuid not null references levels (id) on delete restrict,
  order_index integer not null,
  title text not null,
  title_ar text not null,
  is_free boolean not null default false,
  created_at timestamptz not null default now(),
  unique (mode, order_index)
);

create index lessons_mode_idx on lessons (mode);
create index lessons_level_id_idx on lessons (level_id);

-- Sentences are the individual typing exercises within a lesson, in order.
create table sentences (
  id text primary key,
  lesson_id text not null references lessons (id) on delete cascade,
  order_index integer not null,
  en text not null,
  ar text not null,
  speaker text,
  created_at timestamptz not null default now(),
  unique (lesson_id, order_index)
);

create index sentences_lesson_id_idx on sentences (lesson_id);

-- One row per authenticated user, extending auth.users.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_language text not null default 'ar' check (preferred_language in ('ar', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status subscription_status not null default 'free',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- One row per (user, lesson): tracks completion + accuracy of the latest
-- attempt. attempt_count increments on repeat completions instead of
-- inserting duplicate rows.
create table user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references lessons (id) on delete cascade,
  mode learning_mode not null,
  completed_at timestamptz,
  accuracy numeric(4, 3) check (accuracy >= 0 and accuracy <= 1),
  attempt_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index user_progress_user_id_idx on user_progress (user_id);
create index user_progress_lesson_id_idx on user_progress (lesson_id);

-- One row per user: running streak counters, updated whenever a lesson is
-- completed on a new calendar day.
create table streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Row Level Security: content is public-read; per-user tables are owner-only.
alter table levels enable row level security;
alter table lessons enable row level security;
alter table sentences enable row level security;
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table user_progress enable row level security;
alter table streaks enable row level security;

create policy "Content is publicly readable" on levels for select using (true);
create policy "Content is publicly readable" on lessons for select using (true);
create policy "Content is publicly readable" on sentences for select using (true);

create policy "Users manage their own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users read their own subscription" on subscriptions
  for select using (auth.uid() = user_id);

create policy "Users manage their own progress" on user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own streak" on streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
