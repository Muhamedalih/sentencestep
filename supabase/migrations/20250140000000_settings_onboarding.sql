-- Phase 2 (Settings + onboarding): two small, additive columns on the
-- existing profiles table rather than a new preferences system — same
-- pattern as avatar_id (see 20250132000000_profile_avatar.sql).
--
-- daily_goal: the learner's own target sentence count per day. Previously
-- every day's daily_progress row was seeded from the single app-wide
-- DEFAULT_DAILY_GOAL constant (see increment_daily_progress in
-- 20250131000000_atomic_progress_increments.sql) with no way for a learner
-- to change it — this is that missing durable preference. Existing rows
-- default to 5 (DEFAULT_DAILY_GOAL) so nobody's current goal display changes.
--
-- starting_level: null until a learner has been asked (or has decided) where
-- to start — see the first-time placement picker (StartingLevelOnboarding).
-- 0 means "asked, no preference / skipped," a positive integer is the tier
-- level (1/2/3, matching src/data/units.ts) they chose to jump their first
-- recommended lesson to. Already-progressing learners are never asked (the
-- picker only shows for a learner with zero completions), so this is purely
-- additive for new signups and changes nothing for anyone else.
begin;

alter table public.profiles
  add column if not exists daily_goal integer not null default 5
    check (daily_goal between 1 and 50);

alter table public.profiles
  add column if not exists starting_level integer
    check (starting_level is null or starting_level >= 0);

commit;
