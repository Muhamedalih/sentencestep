-- "Fix Your Mistakes" now highlights every wrong letter in a mistyped word,
-- not just the first one — the single-value `error_index` column (see
-- 20250201000000_mistake_error_index.sql) is superseded by a plural
-- `error_indexes` array holding every distinct wrong-keystroke position from
-- the most recent attempt. Existing single values are backfilled into the
-- new column before the old one is dropped, so no data is lost.
begin;

alter table mistakes
  add column error_indexes integer[] not null default '{}';

update mistakes
set error_indexes = array[error_index]
where error_index is not null;

comment on column mistakes.error_indexes is
  'Zero-based character offsets, within the mistyped word''s own raw text (leading/trailing punctuation included, same substring record_mistake_review/fetchMistakesAction already treat as "the word"), of every wrong keystroke from the most recent attempt at this word. Empty means unknown (rows written before this column existed, or a caller that supplied none) — the UI simply skips the red-letter hint in that case, identical to how a missing next_review_at already means "not scheduled".';

alter table mistakes drop column error_index;

-- Re-declared to accept/store the new array column instead of the old
-- scalar: re-entering an already-corrected word must still refresh
-- error_indexes the same moment it flips back to 'active', same reasoning
-- as sentence_id already being overwritten with the most recent value. An
-- empty/null p_error_indexes (a caller with no positions to report) leaves
-- the previous value in place rather than wiping out real ones.
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
