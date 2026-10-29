-- Passage progress: a save counts only what the database can check, and says what it added.
--
-- record_passage_progress now checks the browser's numbers against the passage's real parts and
-- questions (passage_sections). Parts done and questions are capped at what the passage has, and a
-- passage is finished only when every part is counted. It returns, for the app, stored_sections,
-- parts_added (the parts this call newly stored) and newly_completed (true only on the first finish),
-- so quests and the streak count what is new, not the browser's claims. The app side is in
-- src/lib/passages/actions.ts.
--
-- Security: security definer with set search_path = ''. It reads passage_sections as the owner
-- (learners cannot read those tables) and writes only the caller's own row (auth.uid()).
--
-- Compatibility: the same name and arguments, so the current app call still works. The return
-- type changes from void to a table, so the function is dropped and recreated inside this one
-- transaction. Existing rows are not touched; only new calls go through the new checks.
--
-- Order: apply this file before deploying the app code that reads the returned table. While the
-- function returns no row, the app counts nothing toward passage quests and streaks.

begin;

drop function if exists public.record_passage_progress(text, integer, integer, integer, boolean);

create function public.record_passage_progress(
  p_passage_id text,
  p_sections_done integer,
  p_correct integer,
  p_total integer,
  p_completed boolean
)
returns table (
  stored_sections integer,    -- parts done, as stored after this call
  parts_added integer,        -- parts this call added that were not stored before
  newly_completed boolean     -- true only on the call that first finishes the passage
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_parts integer;
  v_questions integer;
  v_prev_sections integer;
  v_prev_completed timestamptz;
  v_sections integer;
  v_total integer;
  v_correct integer;
  v_completed boolean;
  v_stored_sections integer;
  v_stored_completed timestamptz;
begin
  if v_user is null then
    raise exception 'Sign in to save progress.';
  end if;

  -- One save at a time per learner and passage, so a double tap cannot add a part twice.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user::text || ':' || p_passage_id, 0)
  );

  -- The passage's real shape. Read as the owner, because learners cannot read these tables.
  select count(*)::integer,
         coalesce(sum(case when jsonb_typeof(s.questions) = 'array'
                           then jsonb_array_length(s.questions)
                           else 0 end), 0)::integer
    into v_parts, v_questions
    from public.passage_sections s
   where s.passage_id = p_passage_id;

  if v_parts = 0 then
    raise exception 'Unknown passage.';
  end if;

  select pp.sections_done, pp.completed_at
    into v_prev_sections, v_prev_completed
    from public.passage_progress pp
   where pp.user_id = v_user
     and pp.passage_id = p_passage_id;
  v_prev_sections := coalesce(v_prev_sections, 0);

  -- The browser's numbers, capped at what the passage really has.
  v_sections := least(greatest(coalesce(p_sections_done, 0), 0), v_parts);
  v_total := least(greatest(coalesce(p_total, 0), 0), v_questions);
  v_correct := least(greatest(coalesce(p_correct, 0), 0), v_total);
  -- Finished only when every part is counted. A completion sent too early is saved as far
  -- as it goes: the parts count, the passage is not marked finished.
  v_completed := coalesce(p_completed, false) and v_sections >= v_parts;

  insert into public.passage_progress (
    user_id, passage_id, sections_done, correct_answers, total_questions, completed_at
  )
  values (
    v_user,
    p_passage_id,
    v_sections,
    v_correct,
    v_total,
    case when v_completed then now() end
  )
  on conflict (user_id, passage_id) do update set
    sections_done = greatest(passage_progress.sections_done, excluded.sections_done),
    correct_answers = greatest(passage_progress.correct_answers, excluded.correct_answers),
    total_questions = greatest(passage_progress.total_questions, excluded.total_questions),
    completed_at = coalesce(passage_progress.completed_at, excluded.completed_at),
    updated_at = now();

  select pp.sections_done, pp.completed_at
    into v_stored_sections, v_stored_completed
    from public.passage_progress pp
   where pp.user_id = v_user
     and pp.passage_id = p_passage_id;

  return query select
    v_stored_sections,
    greatest(v_stored_sections - v_prev_sections, 0),
    v_prev_completed is null and v_stored_completed is not null;
end;
$$;

-- The same roles Supabase grants by default on public functions.
grant execute on function public.record_passage_progress(text, integer, integer, integer, boolean)
  to anon, authenticated, service_role;

commit;
