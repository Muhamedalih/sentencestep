-- Extends "Fix Your Mistakes" so a corrected word is checked again later
-- instead of leaving the queue forever the moment it's typed correctly
-- once. Additive only: no existing column, constraint, or row is
-- reinterpreted — a NULL next_review_at (every row that predates this
-- migration) simply means "not currently scheduled for review", the exact
-- same as "no review system existed yet" already read.
begin;

alter table mistakes
  add column review_stage integer not null default 0,
  add column next_review_at timestamptz;

comment on column mistakes.review_stage is
  'How many clean (error-free) reviews in a row this word has passed since its last mistake or reset. Drives the interval picked in record_mistake_review — see that function''s doc comment for the schedule.';
comment on column mistakes.next_review_at is
  'When this corrected word is next due for a spaced review. NULL means "not scheduled": either still active, or the schedule has been exhausted (considered mastered) and it only returns via a genuine future mistake (record_mistake).';

-- Every real "what's due" read filters on all three together (one user,
-- corrected words, actually scheduled) — see fetchDueReviewRows.
create index mistakes_review_due_idx on mistakes (user_id, next_review_at)
  where status = 'corrected' and next_review_at is not null;

-- Re-declared only to also reset the two new columns: re-entering an
-- already-corrected word must clear any pending review the same moment it
-- flips back to 'active', so a word already in the review schedule that
-- gets genuinely mistyped again re-enters the urgent queue outright rather
-- than staying parked as a soft review too — the existing "flips back to
-- active" behavior this function already had is otherwise unchanged.
create or replace function public.record_mistake(p_word text, p_sentence_id text)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into mistakes (user_id, word, sentence_id, status, mistake_count, corrected_at, review_stage, next_review_at)
  values (auth.uid(), p_word, p_sentence_id, 'active', 1, null, 0, null)
  on conflict (user_id, word) do update set
    sentence_id = excluded.sentence_id,
    status = 'active',
    mistake_count = mistakes.mistake_count + 1,
    corrected_at = null,
    review_stage = 0,
    next_review_at = null,
    updated_at = now();
$$;

-- Advances (or resets) one word's review schedule — called once per
-- completed review item in FixYourMistakesSession, exactly like
-- record_mistake is called once per completed sentence. A single atomic
-- UPDATE, not a client read-then-write: review_stage on the right-hand
-- side always refers to the row's value before this statement, so two
-- concurrent calls for the same word can never compute from a stale
-- read (mirrors record_mistake's own `mistake_count = mistakes.mistake_count
-- + 1` reasoning). The `next_review_at <= now()` guard makes a duplicate/
-- replayed call (a second tab, a retried request) a safe no-op: once the
-- first call has pushed next_review_at into the future, the row no longer
-- matches, so it is never advanced or reset twice for one real review.
--
-- v_schedule is a short, hand-picked, roughly-doubling sequence of days
-- (1-indexed to match "review_stage N" meaning "N clean reviews so far") —
-- deliberately not a full spaced-repetition algorithm (no per-item ease
-- factors, no SM-2-style adjustment): simple enough to reason about and
-- to retune later, which is the point of a first version. Clearing every
-- stage in the schedule (review_stage would exceed its length) is
-- "mastered": next_review_at returns to NULL, the same not-scheduled state
-- a corrected word had before this feature existed — it can still return
-- later, but only via a genuine future mistake (record_mistake), not a
-- scheduled review.
create or replace function public.record_mistake_review(p_word text, p_had_errors boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_schedule constant integer[] := array[1, 3, 7, 16];
begin
  if p_had_errors then
    -- The typing engine never lets a wrong letter stand, so this review
    -- was still completed — but not cleanly. Treat it like a fresh miss
    -- for scheduling purposes: back to the first, short interval rather
    -- than advancing, so a word that's still shaky keeps coming back soon
    -- instead of drifting toward "mastered" on a technicality.
    update mistakes
    set review_stage = 0,
        next_review_at = now() + (v_schedule[1] || ' days')::interval,
        updated_at = now()
    where user_id = auth.uid()
      and word = p_word
      and status = 'corrected'
      and next_review_at is not null
      and next_review_at <= now();
  else
    update mistakes
    set review_stage = review_stage + 1,
        next_review_at = case
          when review_stage + 1 <= array_length(v_schedule, 1)
            then now() + (v_schedule[review_stage + 1] || ' days')::interval
          else null
        end,
        updated_at = now()
    where user_id = auth.uid()
      and word = p_word
      and status = 'corrected'
      and next_review_at is not null
      and next_review_at <= now();
  end if;
end;
$$;

commit;
