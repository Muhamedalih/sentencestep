-- Words bank («كلماتي»): the words a learner has met in Today's story and passage (and, later, the ones
-- they star or learn from the core list), each with its own spaced-repetition state.
--
-- One row per (learner, word), created by the FIRST answer to that word: a learner gets a handful of
-- rows a day (Today's words step is five words), never one row per word they have read. The word is
-- stored the way normalizeMistakeWord writes it (trimmed, lower case, no edge punctuation), so "Aunt"
-- and "aunt" are one row, and the row remembers where the word was first met: the story or passage,
-- its title, the meaning the learner saw and the sentence it sat in (the "home sentence"), so a review
-- can show that sentence back after a miss.
--
-- Until now nothing remembered a word as a word: word_mastery is keyed to a Word Lists
-- vocabulary_words row (a story's or passage's target word is not one), vocabulary_encounters only
-- holds words from ordinary lessons, saved_words is the personal-cards deck, and mistakes is the weak
-- list. This table is the one place a learner's words come back after 1 / 3 / 7 / 16 / 30 days and fall
-- back to tomorrow when missed. It reuses the word schedule on purpose (the very ladder word_mastery and
-- sentence_mastery use): no second ladder to keep in step.
--
-- Fully additive: nothing existing is altered. The feature that writes here is the "wordBank" entry on
-- /admin/permissions (Admins only until the owner opens it); until this migration is applied the code
-- degrades quietly (nothing is recorded, nothing is asked back, Today keeps its three tasks).
--
-- Dates are plain `date`s in the LEARNER's calendar (the app sends the day it computed from the
-- learner's time zone), not timestamps: "due tomorrow" must mean tomorrow morning, whatever hour the
-- word was last answered.
begin;

create table if not exists learner_words (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Normalized word (see above): the identity of the row.
  word text not null check (char_length(word) between 1 and 60),
  -- 0 = new or just missed ... 5 = passed the 30-day review.
  strength integer not null default 0 check (strength between 0 and 5),
  due_on date not null,
  last_outcome text not null check (last_outcome in ('clean', 'assisted', 'missed')),
  last_reviewed_on date not null,
  -- Plain tallies, for the learner's own numbers and the owner's read-outs; nothing reads them for
  -- scheduling.
  reviews integer not null default 0,
  clean_reviews integer not null default 0,
  misses integer not null default 0,
  -- Where the word was first met: a Today story or passage, a star on a word while typing, the core
  -- word list, or an ordinary lesson.
  source text not null check (source in ('story', 'passage', 'star', 'core', 'lesson')),
  lesson_id text check (lesson_id is null or char_length(lesson_id) <= 120),
  lesson_title text check (lesson_title is null or char_length(lesson_title) <= 200),
  -- The meaning exactly as the learner saw it when the word entered the bank (their support language).
  ar text not null default '' check (char_length(ar) <= 300),
  -- The full English sentence the word was first met in.
  home_sentence text check (home_sentence is null or char_length(home_sentence) <= 400),
  first_seen_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, word)
);

comment on table learner_words is
  'Per-learner words bank: the words met in Today''s story and passage (and later starred or core words), each with strength 0-5, the learner-local day it is next due and where it was first met. A row exists only after the first answer. Written only through record_learner_word_review().';
comment on column learner_words.strength is
  '0 = new or just missed, 1-5 = consecutive clean answers. The next review is 1 / 3 / 7 / 16 / 30 days after reaching strength 1 / 2 / 3 / 4 / 5. Strength 4 or more (a clean answer after gaps of 1, 3 and 7 days) is "stable".';
comment on column learner_words.due_on is
  'The learner-local calendar day this word is next due. It is due when due_on <= the learner''s today.';
comment on column learner_words.home_sentence is
  'The full English sentence the word was first met in, shown back after a miss. Never shown before the learner answers.';

-- "Which of this learner's words are due" is the one hot read; the learner's whole (small) set of rows
-- is read by the primary key's leading column.
create index if not exists learner_words_due_idx on learner_words (user_id, due_on);

alter table learner_words enable row level security;

-- Same own-rows-only shape as word_mastery and sentence_mastery (auth.uid() wrapped in a select so it
-- is evaluated once per statement, see 20250309000000_optimize_rls_auth_initplan.sql). Dropped first so
-- pasting this file twice does no harm.
drop policy if exists "Users manage their own learner words" on learner_words;
create policy "Users manage their own learner words" on learner_words
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Records one answer to one word and returns where that leaves it.
--
-- p_outcome:
--   'clean'    typed right from the first try with no help: one step up (when the word was due), next
--              review after that step's interval.
--   'assisted' typed right with one help: holds its strength and comes back after the same interval.
--   'missed'   a wrong answer, two helps, or "I don't know": back to strength 0, due tomorrow. Always
--              recorded, even for a word that was not due yet.
--
-- A clean or assisted answer to a word that is NOT due yet (the learner met it again the same day)
-- changes nothing, so repeating a round five times in an afternoon cannot walk a word up the ladder.
--
-- The first answer to a word creates its row, with the context the caller knows (where it was met, its
-- meaning, its home sentence). Later answers never overwrite that context; they only fill what the first
-- one lacked.
--
-- The rules mirror src/lib/word-mastery/schedule.ts (applyOutcome) statement for statement, exactly
-- like record_word_review (20250323000000_word_mastery.sql) and record_sentence_review
-- (20250347000000_sentence_mastery.sql), and src/lib/word-bank/schema.test.ts checks the two stay in
-- step: SQL and TypeScript cannot share one literal. v_days is indexed by the strength just reached
-- (1-5); strength 0 uses the first interval.
--
-- The OUT columns carry the out_ prefix (like record_word_review) so they can never be mistaken for the
-- table's own columns inside the body.
--
-- security invoker: RLS applies, so a learner can only ever touch their own row, and auth.uid() is the
-- only identity trusted (never a client-sent id).
create or replace function public.record_learner_word_review(
  p_word text,
  p_outcome text,
  p_today date,
  p_source text,
  p_ar text default '',
  p_lesson_id text default null,
  p_lesson_title text default null,
  p_home_sentence text default null
)
returns table (out_strength integer, out_due_on date, out_advanced boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_days constant integer[] := array[1, 3, 7, 16, 30];
  v_user uuid := auth.uid();
  v_found boolean;
  v_prev_strength integer := 0;
  v_prev_due date;
  v_strength integer;
  v_due date;
begin
  if v_user is null then
    raise exception 'record_learner_word_review needs a signed-in learner';
  end if;
  if p_outcome not in ('clean', 'assisted', 'missed') then
    raise exception 'unknown outcome: %', p_outcome;
  end if;
  if p_today is null then
    raise exception 'p_today is required';
  end if;
  if p_source not in ('story', 'passage', 'star', 'core', 'lesson') then
    raise exception 'unknown source: %', p_source;
  end if;
  if p_word is null or char_length(p_word) < 1 or char_length(p_word) > 60 then
    raise exception 'a word must be 1-60 characters';
  end if;

  -- Locks the learner's own row (if there is one) so two tabs recording the same word at once cannot
  -- both compute from the same stale strength.
  select lw.strength, lw.due_on
    into v_prev_strength, v_prev_due
  from learner_words lw
  where lw.user_id = v_user
    and lw.word = p_word
  for update;
  v_found := found;
  if not v_found then
    v_prev_strength := 0;
  end if;

  if p_outcome = 'missed' then
    v_strength := 0;
    v_due := p_today + 1;
  elsif v_found and not (v_prev_due <= p_today) then
    -- Answered early: the schedule is left exactly as it was.
    v_strength := v_prev_strength;
    v_due := v_prev_due;
  elsif p_outcome = 'clean' then
    v_strength := least(v_prev_strength + 1, 5);
    v_due := p_today + v_days[v_strength];
  else
    v_strength := v_prev_strength;
    v_due := p_today + v_days[greatest(v_strength, 1)];
  end if;

  insert into learner_words as lw (
    user_id, word, strength, due_on, last_outcome, last_reviewed_on,
    reviews, clean_reviews, misses,
    source, lesson_id, lesson_title, ar, home_sentence, first_seen_on
  )
  values (
    v_user, p_word, v_strength, v_due, p_outcome, p_today,
    1,
    case when p_outcome = 'clean' then 1 else 0 end,
    case when p_outcome = 'missed' then 1 else 0 end,
    p_source,
    left(p_lesson_id, 120),
    left(p_lesson_title, 200),
    left(coalesce(p_ar, ''), 300),
    left(p_home_sentence, 400),
    p_today
  )
  on conflict (user_id, word) do update set
    strength = excluded.strength,
    due_on = excluded.due_on,
    last_outcome = excluded.last_outcome,
    last_reviewed_on = excluded.last_reviewed_on,
    reviews = lw.reviews + 1,
    clean_reviews = lw.clean_reviews + excluded.clean_reviews,
    misses = lw.misses + excluded.misses,
    -- The first meeting keeps its context; a later one only fills what was missing.
    ar = case when lw.ar = '' then excluded.ar else lw.ar end,
    lesson_id = coalesce(lw.lesson_id, excluded.lesson_id),
    lesson_title = coalesce(lw.lesson_title, excluded.lesson_title),
    home_sentence = coalesce(lw.home_sentence, excluded.home_sentence),
    updated_at = now();

  return query select v_strength, v_due, (v_strength > v_prev_strength);
end;
$$;

commit;
