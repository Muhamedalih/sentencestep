-- "Fix Your Mistakes" needs to show the learner which exact letter they got
-- wrong last time, not just which word — additive only: no existing column,
-- constraint, or row is reinterpreted, same shape as the mistake_review_
-- scheduling migration before it.
begin;

alter table mistakes
  add column error_index integer;

comment on column mistakes.error_index is
  'Zero-based character offset, within the mistyped word''s own raw text (leading/trailing punctuation included, same substring record_mistake_review/fetchMistakesAction already treat as "the word"), of the most recent wrong keystroke for this word. NULL means unknown (rows written before this column existed, or a caller that did not supply one) — the UI simply skips the red-letter hint in that case, identical to how a missing next_review_at already means "not scheduled".';

-- Re-declared only to also accept/store the new column: re-entering an
-- already-corrected word must still refresh error_index the same moment it
-- flips back to 'active', same reasoning as sentence_id already being
-- overwritten with the most recent value. A null p_error_index (a caller
-- that has no position to report) leaves the previous value in place rather
-- than wiping out a real one — coalesce, not a blind overwrite, unlike
-- sentence_id, since a missing index is never actually "more recent"
-- information the way a missing sentence_id can't happen at all.
create or replace function public.record_mistake(p_word text, p_sentence_id text, p_error_index integer default null)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into mistakes (user_id, word, sentence_id, status, mistake_count, corrected_at, review_stage, next_review_at, error_index)
  values (auth.uid(), p_word, p_sentence_id, 'active', 1, null, 0, null, p_error_index)
  on conflict (user_id, word) do update set
    sentence_id = excluded.sentence_id,
    status = 'active',
    mistake_count = mistakes.mistake_count + 1,
    corrected_at = null,
    review_stage = 0,
    next_review_at = null,
    error_index = coalesce(excluded.error_index, mistakes.error_index),
    updated_at = now();
$$;

commit;
