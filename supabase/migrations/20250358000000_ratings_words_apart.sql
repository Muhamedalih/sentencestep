-- Ratings of «كلماتي» (the row of stars at the end of a words review, saved in app_ratings with
-- mode = 'words' and lesson_id = 'bank') are a rating of one section, like Passages' and Video's.
-- Admin > Ratings now lists them on their own Words tab; this keeps them out of the app's own figure
-- too: app_rating_distribution() (the per-star counts the quoted site average and the App tab are made
-- of) leaves out 'words' besides 'passages' and 'video'. src/lib/feedback/rating-record.ts already said
-- this had to happen before the section reached learners.
--
-- Only this function is replaced (same name, same result columns); nothing is added, altered or
-- deleted in any table, and running the file twice does no harm. On 2026-11-12 there was one 'words'
-- rating (the owner's own, 5 stars), so the quoted figure moves by one rating.
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
    and r.mode not in ('passages', 'video', 'words')
  group by r.rating
$$;

commit;
