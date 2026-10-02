-- Word Lists: spaced repetition for every word ("Smart word practice").
--
-- One row per (learner, word): how strong the learner's recall of that word is
-- (0 to 5) and the day it is next due for a review. Until now a Word Lists word
-- was either "completed" (typed right once, ever) or not: nothing brought a
-- word back, and a word missed and then typed right a minute later was wiped
-- from the weak list as if it were learned. This table is what lets a word
-- come back on a 1 / 3 / 7 / 16 / 30-day schedule and fall back when missed.
--
-- Fully additive and independent of the rest of the schema: nothing existing is
-- altered. `word_progress` (the "completed once" set the library bar and the
-- daily session still read) and the `mistakes` ledger (weak words, Fix Your
-- Mistakes) keep working exactly as before; the feature that writes here is
-- switched on per audience from /admin/features -> Smart word practice, and
-- until this migration is applied it degrades quietly (no schedule, nothing is
-- recorded, the old behaviour is untouched).
--
-- Dates are plain `date`s in the LEARNER's calendar (the app sends the day it
-- computed from the learner's time zone), not timestamps: "due tomorrow" must
-- mean tomorrow morning, whatever hour the word was last practiced.
begin;

create table if not exists word_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id text not null references vocabulary_words (id) on delete cascade,
  -- 0 = new or just missed ... 5 = passed the 30-day review ("mastered").
  strength integer not null default 0 check (strength between 0 and 5),
  due_on date not null,
  last_outcome text not null check (last_outcome in ('clean', 'assisted', 'missed')),
  last_reviewed_on date not null,
  -- Plain tallies, for the learner's own stats later; nothing reads them for scheduling.
  reviews integer not null default 0,
  clean_reviews integer not null default 0,
  misses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

comment on table word_mastery is
  'Per-learner spaced-repetition state for Word Lists words: strength 0-5 and the learner-local day the word is next due. Written only through record_word_review().';
comment on column word_mastery.strength is
  '0 = new or just missed, 1-5 = consecutive clean reviews passed. The next review is 1 / 3 / 7 / 16 / 30 days after reaching strength 1 / 2 / 3 / 4 / 5.';
comment on column word_mastery.due_on is
  'The learner-local calendar day this word is next due. A word is due when due_on <= the learner''s today.';

-- "What is due for this learner" is the one hot read.
create index if not exists word_mastery_due_idx on word_mastery (user_id, due_on);
-- A word's rows are removed with it (cascade); the lookup by word keeps that cheap.
create index if not exists word_mastery_word_id_idx on word_mastery (word_id);

alter table word_mastery enable row level security;

-- Same own-rows-only shape as word_progress (auth.uid() wrapped in a select so
-- it is evaluated once per statement, see 20250309000000_optimize_rls_auth_initplan.sql).
create policy "Users manage their own word mastery" on word_mastery
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Records one practice visit for one word and returns where that leaves it.
--
-- p_outcome:
--   'clean'    first try, no help: one step up (when the word was due), next
--              review after that step's interval.
--   'assisted' a hint was used but there was no miss: holds its strength and
--              comes back after the same interval.
--   'missed'   a wrong answer or "I don't know": back to strength 0, due
--              tomorrow. Always recorded, even for a word that was not due yet.
--
-- A clean or assisted visit to a word that is NOT due yet (the learner
-- practiced the whole group again the same day) changes nothing, so repeating a
-- group five times in an afternoon cannot walk every word to "mastered".
--
-- The rules mirror src/lib/word-mastery/schedule.ts (applyOutcome) statement for
-- statement, and src/lib/word-mastery/schedule.test.ts checks the two stay in
-- step: SQL and TypeScript cannot share one literal. v_days is indexed by the
-- strength just reached (1-5); strength 0 uses the first interval.
--
-- The OUT columns carry the out_ prefix (like add_quest_progress and
-- badge_metrics) so they can never be mistaken for the table's own columns inside
-- the body.
--
-- security invoker: RLS applies, so a learner can only ever touch their own
-- row, and auth.uid() is the only identity trusted (never a client-sent id).
create or replace function public.record_word_review(
  p_word_id text,
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
    raise exception 'record_word_review needs a signed-in learner';
  end if;
  if p_outcome not in ('clean', 'assisted', 'missed') then
    raise exception 'unknown outcome: %', p_outcome;
  end if;
  if p_today is null then
    raise exception 'p_today is required';
  end if;

  -- Locks the learner's own row (if there is one) so two tabs recording the
  -- same word at once cannot both compute from the same stale strength.
  select wm.strength, wm.due_on
    into v_prev_strength, v_prev_due
  from word_mastery wm
  where wm.user_id = v_user
    and wm.word_id = p_word_id
  for update;
  v_found := found;
  if not v_found then
    v_prev_strength := 0;
  end if;

  if p_outcome = 'missed' then
    v_strength := 0;
    v_due := p_today + 1;
  elsif v_found and not (v_prev_due <= p_today) then
    -- Practiced early: the schedule is left exactly as it was.
    v_strength := v_prev_strength;
    v_due := v_prev_due;
  elsif p_outcome = 'clean' then
    v_strength := least(v_prev_strength + 1, 5);
    v_due := p_today + v_days[v_strength];
  else
    v_strength := v_prev_strength;
    v_due := p_today + v_days[greatest(v_strength, 1)];
  end if;

  insert into word_mastery as wm (
    user_id, word_id, strength, due_on, last_outcome, last_reviewed_on,
    reviews, clean_reviews, misses
  )
  values (
    v_user, p_word_id, v_strength, v_due, p_outcome, p_today,
    1,
    case when p_outcome = 'clean' then 1 else 0 end,
    case when p_outcome = 'missed' then 1 else 0 end
  )
  on conflict (user_id, word_id) do update set
    strength = excluded.strength,
    due_on = excluded.due_on,
    last_outcome = excluded.last_outcome,
    last_reviewed_on = excluded.last_reviewed_on,
    reviews = wm.reviews + 1,
    clean_reviews = wm.clean_reviews + excluded.clean_reviews,
    misses = wm.misses + excluded.misses,
    updated_at = now();

  return query select v_strength, v_due, (v_strength > v_prev_strength);
end;
$$;

commit;
