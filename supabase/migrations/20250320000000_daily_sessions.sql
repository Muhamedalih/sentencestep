-- "Today's session": one row per (user, local day) recording that the learner
-- finished their daily review session, so the XP reward is paid at most once a
-- day no matter how many times they run through it or replay a request. The
-- session itself (what's in it) is computed live from the learner's mistakes,
-- recall, cards and word lists — nothing about its contents is stored.
--
-- complete_daily_session grants the XP through the same increment_xp used by
-- lesson completion, in the same transaction as the insert, and returns
-- whether THIS call was the first completion of the day (false on a repeat,
-- with no XP granted).
begin;

create table if not exists daily_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  completed_at timestamptz not null default now(),
  xp integer not null default 0 check (xp >= 0),
  primary key (user_id, session_date)
);

alter table daily_sessions enable row level security;

create policy "Users manage their own daily sessions" on daily_sessions
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.complete_daily_session(p_date date, p_xp integer)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inserted integer;
begin
  if auth.uid() is null then
    raise exception 'complete_daily_session requires an authenticated user';
  end if;

  insert into daily_sessions (user_id, session_date, xp)
  values (auth.uid(), p_date, greatest(p_xp, 0))
  on conflict (user_id, session_date) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return false;
  end if;
  if p_xp > 0 then
    perform public.increment_xp(p_xp);
  end if;
  return true;
end;
$$;

commit;
