-- Vocabulary Recall: a lightweight, curiosity-framed spaced-repetition queue
-- for the target words a learner has met in Normal lessons and Stories (see
-- Lesson.vocabulary / src/lib/content/story-vocabulary.ts), distinct from
-- `mistakes` (typing errors) and from Word Lists' own catalog/progress. One
-- row per (user, word): the first lesson/story that introduces a word claims
-- it via ON CONFLICT DO NOTHING below, so later re-encounters of the same
-- word never reset its schedule. Content is denormalized onto the row at
-- write time (sentence text, lesson title) rather than joined live against
-- `sentences`/`lessons` — this feature only ever shows the sentence the
-- learner actually met the word in, which never changes after the fact, so
-- there's nothing a live join would give that a snapshot doesn't.
begin;

create table vocabulary_encounters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Always lowercase already (see story-vocabulary.ts's capital-letter
  -- exclusion — capitalized words are filtered out as likely character
  -- names before they can ever be selected), so this is both the typing
  -- target and the dedup identity with no separate normalization step.
  word text not null,
  ar text not null,
  mode text not null check (mode in ('normal', 'stories')),
  lesson_id text not null,
  lesson_title text not null,
  sentence_en text not null,
  -- Index into sentence_en's whitespace-split words (same convention as
  -- Sentence.targetVocabularyIndices) — where `word` sits, so the review
  -- screen can blank it back out of its original sentence.
  word_index integer not null,
  -- How many clean (no wrong attempt) reviews in a row since this word was
  -- first scheduled — same meaning as mistakes.review_stage.
  review_stage integer not null default 0,
  -- Due tomorrow by default (mirrors mistakes' FIRST_REVIEW_INTERVAL_DAYS):
  -- a word just met in a lesson gets a day to settle before it's quizzed.
  -- NULL means "mastered, no longer scheduled" — see record_vocabulary_review.
  next_review_at timestamptz not null default (now() + interval '1 day'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word)
);

-- Every real "what's due" read filters on both together (one user, actually
-- due) — see fetchDueVocabularyRecallRows/fetchDueVocabularyRecallCount.
create index vocabulary_encounters_due_idx on vocabulary_encounters (user_id, next_review_at)
  where next_review_at is not null;

alter table vocabulary_encounters enable row level security;

create policy "Users manage their own vocabulary encounters" on vocabulary_encounters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Atomic "this word was just introduced" write — a plain INSERT would race
-- two near-simultaneous completions that both introduce the same new word;
-- ON CONFLICT DO NOTHING makes the first one to land the permanent owner of
-- that word's schedule, silently dropping every later one, exactly the
-- "first encounter wins" rule this feature is built on.
create or replace function public.record_vocabulary_encounter(
  p_word text,
  p_ar text,
  p_mode text,
  p_lesson_id text,
  p_lesson_title text,
  p_sentence_en text,
  p_word_index integer
)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into vocabulary_encounters (
    user_id, word, ar, mode, lesson_id, lesson_title, sentence_en, word_index
  )
  values (auth.uid(), p_word, p_ar, p_mode, p_lesson_id, p_lesson_title, p_sentence_en, p_word_index)
  on conflict (user_id, word) do nothing;
$$;

-- Advances (or resets) one word's review schedule — the Vocabulary Recall
-- counterpart to record_mistake_review, same hand-picked roughly-doubling
-- schedule for consistency with the rest of the app's spaced review. The
-- `next_review_at <= now()` guard makes a duplicate/replayed call a safe
-- no-op, same reasoning as record_mistake_review's identical guard.
create or replace function public.record_vocabulary_review(p_word text, p_had_errors boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_schedule constant integer[] := array[1, 3, 7, 16];
begin
  if p_had_errors then
    update vocabulary_encounters
    set review_stage = 0,
        next_review_at = now() + (v_schedule[1] || ' days')::interval,
        updated_at = now()
    where user_id = auth.uid()
      and word = p_word
      and next_review_at is not null
      and next_review_at <= now();
  else
    update vocabulary_encounters
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
