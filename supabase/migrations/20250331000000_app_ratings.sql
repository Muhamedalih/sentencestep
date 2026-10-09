-- App ratings: the 1-5 star rating + optional comment a learner gives the
-- whole app (RatingModal), now kept in the database so Admin > Ratings can
-- list, filter and answer them, and so the best ones can be shown on the site
-- later. Until now they only went to a Google Sheet (src/lib/feedback/actions.ts),
-- which is still written as a backup but can't be linked to an account or
-- queried from the site.
--
-- Not to be confused with book_ratings (20250308000000), which is one rating
-- per (user, book).
--
-- Rows are written only by the server action, through the service-role
-- connection — guests have no session, so there is deliberately NO insert
-- policy: nobody can plant a row through PostgREST. Admins read and triage
-- them through their normal session.
begin;

create table app_ratings (
  id uuid primary key default gen_random_uuid(),
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  -- Where it was given: the lesson it followed ("settings" when it came from
  -- the Settings card) and that lesson's mode ("normal", "stories", ...).
  lesson_id text not null default '' check (char_length(lesson_id) <= 100),
  mode text not null default '' check (char_length(mode) <= 40),
  locale text not null default 'en' check (char_length(locale) <= 10),
  user_type text not null check (user_type in ('member', 'guest')),
  -- Set for ratings given while signed in. A rating is the account holder's
  -- own words, so it goes with the account when it is deleted. Null for
  -- guests, and for ratings imported from the old sheet (which only kept an
  -- anonymous browser id).
  user_id uuid references auth.users (id) on delete cascade,
  -- Where a reply can go: a member's account email at the time they rated, or
  -- the address a guest chose to leave. Null when there is no way to reply.
  contact_email text check (contact_email is null or char_length(contact_email) <= 254),
  -- Random per-browser id (rating-storage.ts) — never an account id.
  anon_id text not null default '' check (char_length(anon_id) <= 100),
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  -- Whether the admin approved showing this rating (and its comment) on the
  -- site. Off for everything until someone turns it on.
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin's default view is "everything not archived, newest first".
create index app_ratings_status_created_at_idx on app_ratings (status, created_at desc);
create index app_ratings_created_at_idx on app_ratings (created_at desc);
-- What a future "what learners say" section reads.
create index app_ratings_public_idx on app_ratings (created_at desc) where is_public;
create index app_ratings_user_id_idx on app_ratings (user_id);

alter table app_ratings enable row level security;

-- No public SELECT policy on purpose: a row carries contact_email and user_id,
-- and RLS can't hide single columns. Showing approved ratings on the site goes
-- through listPublicAppRatings (src/lib/admin/ratings-queries.ts), which reads
-- only the safe columns of is_public rows on the server.
create policy "Admins manage app ratings" on app_ratings
  for all using (is_admin()) with check (is_admin());

-- How many ratings per star, for the summary at the top of Admin > Ratings.
-- One grouped aggregate instead of pulling every row (PostgREST caps a plain
-- select at 1,000 rows). Security invoker: the policy above already decides
-- who sees rows, so a non-admin simply gets nothing back.
create or replace function public.app_rating_distribution()
returns table (rating smallint, rating_count integer)
language sql
security invoker
stable
set search_path = public
as $$
  select r.rating, count(*)::integer
  from app_ratings r
  group by r.rating
$$;

commit;
