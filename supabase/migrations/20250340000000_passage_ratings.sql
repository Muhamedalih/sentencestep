-- Ratings of the Passages section, kept apart from the app's own ratings.
-- Run AFTER 20250332000000_ratings_display_settings.sql.
--
-- The one-time "what do you think of Passages?" card (PassageRatingPrompt) saves its answer in
-- the same app_ratings table as every other rating, marked mode = 'passages' (and lesson_id =
-- the passage the learner had just finished). No new table or column is needed — only the two
-- per-star counts below change meaning, so the section's opinion never moves the figure that
-- describes the app itself:
--
--   app_rating_distribution()      the APP's per-star counts: everything not archived and not
--                                  a Passages rating. This is what /upgrade quotes ("4.8 average
--                                  from N ratings") and what Admin > Ratings shows on its App tab.
--   passage_rating_distribution()  the same count for the Passages tab only.
--
-- Safe to run more than once, and safe to run before the matching code is deployed: until then
-- no row has mode = 'passages', so the app's figures do not change.
begin;

create or replace function public.app_rating_distribution()
returns table (rating smallint, rating_count integer)
language sql
security invoker
stable
set search_path = public
as $$
  select r.rating, count(*)::integer
  from app_ratings r
  where r.status <> 'archived'
    and r.mode <> 'passages'
  group by r.rating
$$;

create or replace function public.passage_rating_distribution()
returns table (rating smallint, rating_count integer)
language sql
security invoker
stable
set search_path = public
as $$
  select r.rating, count(*)::integer
  from app_ratings r
  where r.status <> 'archived'
    and r.mode = 'passages'
  group by r.rating
$$;

commit;
