-- Per-day activity log (feeds the streak calendar) and the monthly streak-freeze
-- balance.
--
-- activity_days: one row per (user, local calendar day) the learner practiced
-- — plus rows for days the streak was carried across without practice: kind
-- 'grace' (the free forgiven missed day, see src/lib/progress/streak.ts) and
-- 'frozen' (covered by a streak freeze). Written only through the functions
-- below, on lesson completion. Backfilled here from what already exists so
-- the calendar isn't blank for people who were learning before this shipped:
-- daily_progress (sentences per day) and lesson_attempts (every attempt's
-- timestamp; the UTC calendar date is the best approximation of the
-- learner's local day available after the fact).
--
-- streak_freeze_usage: one row per user, keyed on a 'YYYY-MM' period. The
-- learner's remaining balance is (admin-configured monthly allowance -
-- used) for the CURRENT month; a row from an earlier month simply counts as
-- zero used, so there is no monthly reset job. The allowance itself lives in
-- feature_settings (20250315000000), not here.
begin;

create table if not exists activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  sentences integer not null default 0 check (sentences >= 0),
  xp integer not null default 0 check (xp >= 0),
  kind text not null default 'active' check (kind in ('active', 'grace', 'frozen')),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists streak_freeze_usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  used integer not null default 0 check (used >= 0),
  updated_at timestamptz not null default now()
);

alter table activity_days enable row level security;
alter table streak_freeze_usage enable row level security;

create policy "Users manage their own activity days" on activity_days
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users manage their own streak freeze usage" on streak_freeze_usage
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- One practiced day. Additive on conflict (two completions the same day sum
-- their sentences/XP) and always upgrades a bridge row to 'active' — a day
-- the learner really practiced is never displayed as grace/frozen.
create or replace function public.record_activity_day(p_day date, p_sentences integer, p_xp integer)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into activity_days (user_id, day, sentences, xp, kind, updated_at)
  values (auth.uid(), p_day, greatest(p_sentences, 0), greatest(p_xp, 0), 'active', now())
  on conflict (user_id, day) do update set
    sentences = activity_days.sentences + greatest(p_sentences, 0),
    xp = activity_days.xp + greatest(p_xp, 0),
    kind = 'active',
    updated_at = now();
$$;

-- Days the streak was carried across. DO NOTHING on conflict: a real
-- practiced day is never overwritten by a bridge marker.
create or replace function public.record_streak_bridge_days(p_days date[], p_kinds text[])
returns void
language sql
security invoker
set search_path = public
as $$
  insert into activity_days (user_id, day, kind, updated_at)
  select auth.uid(), t.day, t.kind, now()
  from unnest(p_days, p_kinds) as t(day, kind)
  where t.kind in ('grace', 'frozen')
  on conflict (user_id, day) do nothing;
$$;

-- Atomically spends p_count freezes from this period's allowance. Returns how
-- many were spent: p_count on success, 0 when the balance couldn't cover it
-- (the caller then lets the streak reset instead). Row-locked so two
-- near-simultaneous completions can't both spend the same freeze.
create or replace function public.consume_streak_freezes(p_period text, p_count integer, p_monthly integer)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_used integer;
begin
  if auth.uid() is null then
    raise exception 'consume_streak_freezes requires an authenticated user';
  end if;
  if p_count <= 0 then
    return 0;
  end if;

  insert into streak_freeze_usage (user_id, period, used)
  values (auth.uid(), p_period, 0)
  on conflict (user_id) do update set
    period = excluded.period,
    used = case when streak_freeze_usage.period = excluded.period then streak_freeze_usage.used else 0 end;

  select used into v_used from streak_freeze_usage where user_id = auth.uid() for update;

  if v_used + p_count > p_monthly then
    return 0;
  end if;

  update streak_freeze_usage
  set used = used + p_count, updated_at = now()
  where user_id = auth.uid();
  return p_count;
end;
$$;

-- Backfill from existing history (see header). Idempotent.
insert into activity_days (user_id, day, sentences, kind)
select user_id, date, sentences_completed, 'active'
from daily_progress
where sentences_completed > 0
on conflict (user_id, day) do nothing;

insert into activity_days (user_id, day, kind)
select user_id, (created_at at time zone 'utc')::date, 'active'
from lesson_attempts
group by user_id, (created_at at time zone 'utc')::date
on conflict (user_id, day) do nothing;

commit;
