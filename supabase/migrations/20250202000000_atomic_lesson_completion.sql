-- Closes the one remaining read-then-write gap in lesson completion:
-- recordCompletionAction (src/lib/progress/actions.ts) determined
-- isFirstCompletion/lessonCountBefore from a separate fetchUserProgress read
-- taken BEFORE writing the completion row — the exact race
-- 20250131000000_atomic_progress_increments.sql already fixed for XP and
-- daily progress (two near-simultaneous completions of the same lesson, from
-- two open tabs or a slow-network retry racing the original request, could
-- both read "not completed yet" and both be treated as a first completion:
-- double first-completion XP bonus, and a lesson-count milestone/email
-- potentially firing twice). upsertLessonCompletion's own attempt_count had
-- the same shape (read attempt_count, write attempt_count + 1 as an absolute
-- value), the same client-computed-absolute-value bug record_mistake and the
-- Milestone 15 migration already warned against.
--
-- Same pattern as complete_book_sentence (20250128000000_book_learning_engine.sql):
-- a single INSERT ... ON CONFLICT DO UPDATE, with "was this a first
-- completion" read back from the same statement via the standard
-- `xmax = 0` upsert-returning-was-inserted trick, rather than a prior
-- separate read. attempt_count is likewise incremented in the database, not
-- read-then-added-to in application code.
begin;

create or replace function public.complete_lesson(p_lesson_id text, p_mode learning_mode, p_accuracy numeric)
returns table(is_first_completion boolean, attempt_count integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'complete_lesson requires an authenticated user';
  end if;

  return query
  insert into user_progress (user_id, lesson_id, mode, accuracy, completed_at, attempt_count, updated_at)
  values (v_user_id, p_lesson_id, p_mode, p_accuracy, now(), 1, now())
  on conflict (user_id, lesson_id) do update set
    mode = excluded.mode,
    accuracy = excluded.accuracy,
    completed_at = now(),
    attempt_count = user_progress.attempt_count + 1,
    updated_at = now()
  returning (xmax = 0), user_progress.attempt_count;
end;
$$;

commit;
