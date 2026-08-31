-- Word Lists: vocabulary practice, organized Level > Group > Word.
--
-- Three new tables, fully additive — no existing table, enum, or column is
-- touched. Deliberately NOT layered onto lessons/sentences/user_progress:
-- a vocabulary word is "one target word taught through one context
-- sentence," a genuinely different shape from a multi-sentence typing
-- lesson, and word_groups.level reuses the same 1/2/3 Beginner/
-- Intermediate/Advanced tier semantics as levels.index elsewhere in the
-- app (see src/lib/levels.ts's difficultyForLevel) without being a
-- `learning_mode` itself — Word Lists is a sibling feature to the three
-- learning modes, not a fourth one.
begin;

create table word_groups (
  id text primary key,
  level integer not null check (level >= 1 and level <= 3),
  order_index integer not null unique,
  title text not null,
  title_ar text not null,
  description text,
  description_ar text,
  is_free boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index word_groups_level_idx on word_groups (level);

-- Sentence stores the English context sentence with a literal "___" token
-- standing in for target_word — never the word itself, so the learner
-- can't see the answer before typing it. See BLANK_TOKEN in
-- src/types/word-lists.ts, the single place this convention is documented.
create table vocabulary_words (
  id text primary key,
  group_id text not null references word_groups (id) on delete cascade,
  order_index integer not null,
  target_word text not null,
  sentence text not null,
  hint_ar text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, order_index)
);

create index vocabulary_words_group_id_idx on vocabulary_words (group_id);

-- One row per (user, word): has this learner ever typed this word
-- correctly. Mirrors user_progress's shape (unique per owner+content,
-- upserted on repeat) but deliberately its own table rather than a reused
-- one — user_progress is keyed to a lessons.id foreign key and a
-- learning_mode value, neither of which a vocabulary word is. Word Lists
-- progress is intentionally NOT wired into XP/streak/daily-goal — it has
-- its own, simpler "how many of this group's words have I gotten right"
-- signal, not a second path into the lesson-completion gamification loop.
create table word_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id text not null references vocabulary_words (id) on delete cascade,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word_id)
);

create index word_progress_user_id_idx on word_progress (user_id);
create index word_progress_word_id_idx on word_progress (word_id);

alter table word_groups enable row level security;
alter table vocabulary_words enable row level security;
alter table word_progress enable row level security;

-- Same public-read / admin-write shape as levels/lessons/sentences
-- (is_admin() is already defined in 20250108000000_admin_cms.sql).
create policy "Published word groups are public; admins see all" on word_groups
  for select using (status = 'published' or is_admin());
create policy "Admins manage word groups" on word_groups
  for all using (is_admin()) with check (is_admin());

create policy "Words in published free groups are public; premium needs access; admins see all" on vocabulary_words
  for select using (
    is_admin()
    or exists (
      select 1
      from word_groups
      where word_groups.id = vocabulary_words.group_id
        and word_groups.status = 'published'
        and (
          word_groups.is_free
          or exists (
            select 1
            from subscriptions
            where subscriptions.user_id = auth.uid()
              and subscriptions.status in ('active', 'trialing')
              and (
                subscriptions.current_period_end is null
                or subscriptions.current_period_end > now()
              )
          )
        )
    )
  );
create policy "Admins manage vocabulary words" on vocabulary_words
  for all using (is_admin()) with check (is_admin());

create policy "Users manage their own word progress" on word_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
