-- Sentence bank: spaced repetition for the sentences a learner has typed in lessons and stories.
--
-- One row per (learner, sentence), created by the FIRST review of that sentence: "no row" means the
-- sentence was never asked back, which counts as new and therefore due (the convention word_mastery
-- uses for words). That keeps the table sparse: a learner gets a handful of rows a day (the daily
-- batch is three sentences), never one row per sentence they have typed.
--
-- Nothing in the existing schema remembers WHAT a learner typed: a lesson is "completed" as a whole
-- (user_progress), mistakes are kept per word (mistakes) and Word Lists words per word
-- (word_mastery). This table is what lets a sentence come back, with its text hidden, after 1 / 3 / 7 /
-- 16 / 30 days, and fall back to tomorrow when it is missed. It reuses the word schedule on purpose:
-- no second ladder to keep in step.
--
-- Fully additive: nothing existing is altered. The feature that writes here is the "sentenceBank"
-- entry on /admin/permissions (Admins only until the owner opens it); until this migration is applied
-- the code degrades quietly (no sentence is ever asked back, nothing is recorded, and Today keeps its
-- three tasks).
--
-- Dates are plain `date`s in the LEARNER's calendar (the app sends the day it computed from the
-- learner's time zone), not timestamps: "due tomorrow" must mean tomorrow morning, whatever hour the
-- sentence was last reviewed.
begin;

create table if not exists sentence_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  sentence_id text not null references sentences (id) on delete cascade,
  -- 0 = just missed (or held at the start by help) ... 5 = passed the 30-day review.
  strength integer not null default 0 check (strength between 0 and 5),
  due_on date not null,
  last_outcome text not null check (last_outcome in ('clean', 'assisted', 'missed')),
  last_reviewed_on date not null,
  -- Plain tallies, for the learner's own numbers and the owner's read-outs later; nothing reads them
  -- for scheduling.
  reviews integer not null default 0,
  clean_reviews integer not null default 0,
  misses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, sentence_id)
);

comment on table sentence_mastery is
  'Per-learner spaced-repetition state for typed sentences: strength 0-5 and the learner-local day the sentence is next due. A row exists only after the first review. Written only through record_sentence_review().';
comment on column sentence_mastery.strength is
  '0 = just missed, 1-5 = consecutive clean reviews passed. The next review is 1 / 3 / 7 / 16 / 30 days after reaching strength 1 / 2 / 3 / 4 / 5. A sentence at 2 or more counts as "stable" (typed right from hidden text after a gap of a day or more).';
comment on column sentence_mastery.due_on is
  'The learner-local calendar day this sentence is next due. It is due when due_on <= the learner''s today.';

-- "Which of this learner's sentences are due" is the one hot read; the learner's whole (small) set of
-- rows is read by the primary key's leading column.
create index if not exists sentence_mastery_due_idx on sentence_mastery (user_id, due_on);
-- A sentence's rows are removed with it (cascade); the lookup by sentence keeps that cheap.
create index if not exists sentence_mastery_sentence_id_idx on sentence_mastery (sentence_id);

alter table sentence_mastery enable row level security;

-- Same own-rows-only shape as word_mastery (auth.uid() wrapped in a select so it is evaluated once per
-- statement, see 20250309000000_optimize_rls_auth_initplan.sql). Dropped first so pasting this file
-- twice does no harm.
drop policy if exists "Users manage their own sentence mastery" on sentence_mastery;
create policy "Users manage their own sentence mastery" on sentence_mastery
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Records one review of one sentence and returns where that leaves it.
--
-- p_outcome:
--   'clean'    typed right from hidden text with no help: one step up (when the sentence was due),
--              next review after that step's interval.
--   'assisted' typed right with one help: holds its strength and comes back after the same interval.
--   'missed'   a wrong answer, two helps, or "I don't remember": back to strength 0, due tomorrow.
--              Always recorded, even for a sentence that was not due yet.
--
-- A clean or assisted visit to a sentence that is NOT due yet (the learner reviewed it again the same
-- day) changes nothing, so repeating a batch five times in an afternoon cannot walk a sentence up the
-- ladder.
--
-- The rules mirror src/lib/word-mastery/schedule.ts (applyOutcome) — the very ladder words use —
-- statement for statement, exactly like record_word_review (20250323000000_word_mastery.sql), and
-- src/lib/sentence-bank/review.test.ts checks the two stay in step: SQL and TypeScript cannot share
-- one literal. v_days is indexed by the strength just reached (1-5); strength 0 uses the first
-- interval.
--
-- The OUT columns carry the out_ prefix (like record_word_review) so they can never be mistaken for
-- the table's own columns inside the body.
--
-- security invoker: RLS applies, so a learner can only ever touch their own row, and auth.uid() is
-- the only identity trusted (never a client-sent id).
create or replace function public.record_sentence_review(
  p_sentence_id text,
  p_outcome text,
  p_today date
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
    raise exception 'record_sentence_review needs a signed-in learner';
  end if;
  if p_outcome not in ('clean', 'assisted', 'missed') then
    raise exception 'unknown outcome: %', p_outcome;
  end if;
  if p_today is null then
    raise exception 'p_today is required';
  end if;

  -- Locks the learner's own row (if there is one) so two tabs recording the same sentence at once
  -- cannot both compute from the same stale strength.
  select sm.strength, sm.due_on
    into v_prev_strength, v_prev_due
  from sentence_mastery sm
  where sm.user_id = v_user
    and sm.sentence_id = p_sentence_id
  for update;
  v_found := found;
  if not v_found then
    v_prev_strength := 0;
  end if;

  if p_outcome = 'missed' then
    v_strength := 0;
    v_due := p_today + 1;
  elsif v_found and not (v_prev_due <= p_today) then
    -- Reviewed early: the schedule is left exactly as it was.
    v_strength := v_prev_strength;
    v_due := v_prev_due;
  elsif p_outcome = 'clean' then
    v_strength := least(v_prev_strength + 1, 5);
    v_due := p_today + v_days[v_strength];
  else
    v_strength := v_prev_strength;
    v_due := p_today + v_days[greatest(v_strength, 1)];
  end if;

  insert into sentence_mastery as sm (
    user_id, sentence_id, strength, due_on, last_outcome, last_reviewed_on,
    reviews, clean_reviews, misses
  )
  values (
    v_user, p_sentence_id, v_strength, v_due, p_outcome, p_today,
    1,
    case when p_outcome = 'clean' then 1 else 0 end,
    case when p_outcome = 'missed' then 1 else 0 end
  )
  on conflict (user_id, sentence_id) do update set
    strength = excluded.strength,
    due_on = excluded.due_on,
    last_outcome = excluded.last_outcome,
    last_reviewed_on = excluded.last_reviewed_on,
    reviews = sm.reviews + 1,
    clean_reviews = sm.clean_reviews + excluded.clean_reviews,
    misses = sm.misses + excluded.misses,
    updated_at = now();

  return query select v_strength, v_due, (v_strength > v_prev_strength);
end;
$$;

commit;
