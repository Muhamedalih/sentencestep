-- Word Lists practice (VocabularyPractice) never recorded a mistake when a
-- learner typed a word wrong -- only a correct answer wrote anything
-- (masterMistakeWordAction, clearing the word from "Review All Words"). The
-- missing half of that pair couldn't be added before this migration because
-- mistakes.sentence_id was `not null references sentences(id)`, and
-- vocabulary_words (Word Lists' own content table) is deliberately separate
-- from sentences -- see 20250119000000_word_lists.sql's doc comment -- so no
-- Word-List-originated mistake could ever satisfy that constraint.
--
-- Dropping the not-null lets a mistake be recorded with sentence_id = null
-- for "this word was missed outside any lesson sentence." Every existing
-- reader already treats an unresolvable sentence_id as "drop this row from
-- a sentence-scoped view" (see fetchMistakesAction's `if (!sentence)
-- continue`), which is exactly the right behavior here: a Word-List mistake
-- with no sentence simply never appears in the per-lesson "Fix Your
-- Mistakes" queue, while still counting as weak for "Review All Words"
-- (weak-words never reads sentence_id at all).
begin;

alter table mistakes alter column sentence_id drop not null;

-- Re-declared only because sentence_id can now legitimately be null on
-- write -- the insert/update logic itself is otherwise unchanged from
-- 20250219000000_mistake_error_indexes.sql.
create or replace function public.record_mistake(
  p_word text,
  p_sentence_id text,
  p_error_indexes integer[] default null
)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into mistakes (user_id, word, sentence_id, status, mistake_count, corrected_at, review_stage, next_review_at, error_indexes)
  values (auth.uid(), p_word, p_sentence_id, 'active', 1, null, 0, null, coalesce(p_error_indexes, '{}'))
  on conflict (user_id, word) do update set
    sentence_id = excluded.sentence_id,
    status = 'active',
    mistake_count = mistakes.mistake_count + 1,
    corrected_at = null,
    review_stage = 0,
    next_review_at = null,
    error_indexes = case
      when p_error_indexes is null or array_length(p_error_indexes, 1) is null
        then mistakes.error_indexes
      else p_error_indexes
    end,
    updated_at = now();
$$;

commit;
