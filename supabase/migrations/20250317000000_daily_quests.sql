-- Daily quests: three quests per learner per local calendar day, dealt from an
-- admin-configurable pool (see feature_settings, 20250315000000, and
-- src/lib/features/quests.ts for the dealing rules). One row per
-- (user, day, slot) holding the quest's type, its target/XP as of when it
-- was dealt (so an admin retuning the pool never rewrites a quest a learner
-- is halfway through), and live progress.
--
-- Progress and the XP reward are applied by one function, atomically:
-- add_quest_progress row-locks the matching quest(s), advances progress
-- (capped at the target), and — only on the transition to completed —
-- grants the quest's XP through the same increment_xp used everywhere else,
-- so a duplicate/replayed event can never pay out twice.
begin;

create table if not exists daily_quests (
  user_id uuid not null references auth.users (id) on delete cascade,
  quest_date date not null,
  slot smallint not null check (slot >= 0),
  quest_type text not null,
  target integer not null check (target > 0),
  xp integer not null default 0 check (xp >= 0),
  progress integer not null default 0 check (progress >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, quest_date, slot)
);

alter table daily_quests enable row level security;

create policy "Users manage their own daily quests" on daily_quests
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Advances every quest of `p_type` for the day. p_date is the learner's local
-- date when the caller knows it (lesson completion does); events raised from
-- places that don't (a word review) pass null and land on the learner's most
-- recent quest day within one day of UTC "today" — every real timezone is
-- within that window, so a late-evening learner's events still find the
-- quests dealt for their local date.
create or replace function public.add_quest_progress(p_type text, p_amount integer, p_date date default null)
returns table(out_slot smallint, out_type text, out_xp integer, out_progress integer, out_target integer, out_completed_now boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_date date := p_date;
  r record;
  v_next integer;
  v_done boolean;
begin
  if auth.uid() is null then
    raise exception 'add_quest_progress requires an authenticated user';
  end if;
  if p_amount is null or p_amount <= 0 then
    return;
  end if;

  if v_date is null then
    select max(quest_date) into v_date
    from daily_quests
    where user_id = auth.uid()
      and quest_date between (now() at time zone 'utc')::date - 1 and (now() at time zone 'utc')::date + 1;
  end if;
  if v_date is null then
    return;
  end if;

  for r in
    select * from daily_quests
    where user_id = auth.uid() and quest_date = v_date and quest_type = p_type
    for update
  loop
    v_next := least(r.target, r.progress + p_amount);
    v_done := r.completed_at is null and v_next >= r.target;

    update daily_quests
    set progress = v_next,
        completed_at = case when v_done then now() else completed_at end,
        updated_at = now()
    where user_id = r.user_id and quest_date = r.quest_date and slot = r.slot;

    if v_done and r.xp > 0 then
      perform public.increment_xp(r.xp);
    end if;

    out_slot := r.slot;
    out_type := r.quest_type;
    out_xp := r.xp;
    out_progress := v_next;
    out_target := r.target;
    out_completed_now := v_done;
    return next;
  end loop;
end;
$$;

commit;
