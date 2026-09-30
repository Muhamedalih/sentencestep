-- Badges: permanent achievements. user_badges holds only what a learner has
-- EARNED (one row per user+badge); the catalog itself (ids, thresholds,
-- names) is application code — src/lib/features/catalog.ts — so adding or
-- retuning a badge never needs a migration, and an admin can switch any
-- badge off from /admin/features without touching earned rows.
--
-- badge_metrics() returns every stat a metric badge is measured against in a
-- single round trip, straight from the tables that already exist — which is
-- also what makes badges retroactive: the first evaluation after this ships
-- awards everything a learner's existing history already qualifies for.
begin;

create table if not exists user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  -- null until the learner has seen it on the Achievements page, which is
  -- what drives its "new" marker.
  seen_at timestamptz,
  primary key (user_id, badge_id)
);

alter table user_badges enable row level security;

create policy "Users manage their own badges" on user_badges
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Inserts the given badges for the caller; returns the ids that were NEW (the
-- conflict is ignored, so a replay or a concurrent evaluation never awards
-- twice and never reports a badge as newly earned twice).
create or replace function public.award_badges(p_ids text[])
returns table(out_badge_id text)
language sql
security invoker
set search_path = public
as $$
  insert into user_badges (user_id, badge_id)
  select auth.uid(), unnest(p_ids)
  on conflict (user_id, badge_id) do nothing
  returning badge_id;
$$;

create or replace function public.mark_badges_seen()
returns void
language sql
security invoker
set search_path = public
as $$
  update user_badges set seen_at = now()
  where user_id = auth.uid() and seen_at is null;
$$;

create or replace function public.badge_metrics()
returns table(
  out_longest_streak integer,
  out_total_sentences bigint,
  out_lesson_count bigint,
  out_perfect_lessons bigint,
  out_max_wpm integer,
  out_xp integer,
  out_fixed_words bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select s.longest_streak from streaks s where s.user_id = auth.uid()), 0),
    coalesce((select sum(a.sentences) from activity_days a where a.user_id = auth.uid()), 0)::bigint,
    (select count(*) from user_progress p where p.user_id = auth.uid() and p.completed_at is not null),
    (select count(*) from user_progress p where p.user_id = auth.uid() and p.completed_at is not null and p.accuracy >= 1),
    coalesce((select max(l.wpm) from lesson_attempts l where l.user_id = auth.uid()), 0),
    coalesce((select x.xp from user_xp x where x.user_id = auth.uid()), 0),
    (select count(*) from mistakes m where m.user_id = auth.uid() and m.status = 'corrected');
$$;

commit;
