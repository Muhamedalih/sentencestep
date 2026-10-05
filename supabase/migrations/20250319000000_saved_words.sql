-- Personal word cards: words a learner saves (a star on the current-word card
-- while typing a Normal lesson or Story) into their own spaced-review deck,
-- which they can also export for Anki. One row per (user, word): the word is
-- the normalized form used everywhere else (normalizeMistakeWord), so saving
-- "Went" and "went" is the same card.
--
-- The card keeps the sentence it was met in (a snapshot, like
-- vocabulary_encounters) so review can show it with the word blanked out, and
-- the meaning exactly as the learner saw it when they saved it (in their
-- support language at the time). sentence_id has no foreign key on purpose: a
-- deleted/re-authored sentence must never delete a learner's saved word; it is
-- only used to resolve pronunciation, which falls back gracefully.
--
-- Review uses the same 1/3/7/16-day schedule as Fix Your Mistakes and
-- Vocabulary Recall. next_review_at NULL means the schedule is exhausted
-- (mastered); a brand-new card is first due a day after it was saved.
begin;

create table if not exists saved_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word text not null,
  meaning text not null,
  mode text not null check (mode in ('normal', 'stories')),
  lesson_id text not null,
  lesson_title text not null,
  sentence_id text,
  sentence_en text not null,
  word_index integer not null check (word_index >= 0),
  review_stage integer not null default 0,
  next_review_at timestamptz default (now() + interval '1 day'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word)
);

create index if not exists saved_words_due_idx on saved_words (user_id, next_review_at)
  where next_review_at is not null;

alter table saved_words enable row level security;

create policy "Users manage their own saved words" on saved_words
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Advances (or resets) one card's schedule after a review; the counterpart to
-- record_vocabulary_review, same schedule and the same `next_review_at <= now()`
-- guard that makes a duplicate/replayed call a safe no-op.
create or replace function public.record_card_review(p_word text, p_had_errors boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_schedule constant integer[] := array[1, 3, 7, 16];
begin
  if p_had_errors then
    update saved_words
    set review_stage = 0,
        next_review_at = now() + (v_schedule[1] || ' days')::interval,
        updated_at = now()
    where user_id = auth.uid()
      and word = p_word
      and next_review_at is not null
      and next_review_at <= now();
  else
    update saved_words
    set review_stage = review_stage + 1,
        next_review_at = case
          when review_stage + 1 <= array_length(v_schedule, 1)
            then now() + (v_schedule[review_stage + 1] || ' days')::interval
          else null
        end,
        updated_at = now()
    where user_id = auth.uid()
      and word = p_word
      and next_review_at is not null
      and next_review_at <= now();
  end if;
end;
$$;

commit;
