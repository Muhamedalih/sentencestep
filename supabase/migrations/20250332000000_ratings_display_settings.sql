-- Admin switches for showing ratings to the public, and a stricter rating count.
-- Run AFTER 20250331000000_app_ratings.sql.
--
-- 1. ratings_settings: one row, two switches, edited from Admin > Ratings.
--      show_rating_proof    the "average from N ratings" line on /upgrade, worked
--                           out from the app_ratings table (it used to be typed
--                           in by hand as environment variables).
--      show_public_ratings  whether ratings an admin approved ("Show on site") may
--                           be shown to visitors at all. Off hides every one of
--                           them at once, without un-approving each.
--    Both start OFF, so nothing is shown until an admin turns it on. Same
--    singleton shape as access_settings and feature_settings. Publicly readable
--    on purpose: two booleans, no secrets, and the site needs to know them. Only
--    admins can change them.
--
-- 2. app_rating_distribution(): an archived rating no longer counts. Archiving is
--    how an admin takes a junk or spam rating out of the average, in Admin >
--    Ratings and on the site.
--
-- Safe to run more than once.
begin;

create table if not exists ratings_settings (
  id integer primary key default 1,
  show_rating_proof boolean not null default false,
  show_public_ratings boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint ratings_settings_singleton check (id = 1)
);

insert into ratings_settings (id) values (1) on conflict (id) do nothing;

alter table ratings_settings enable row level security;

drop policy if exists "Ratings settings are publicly readable" on ratings_settings;
create policy "Ratings settings are publicly readable" on ratings_settings
  for select using (true);

drop policy if exists "Admins manage ratings settings" on ratings_settings;
create policy "Admins manage ratings settings" on ratings_settings
  for all using ((select is_admin())) with check ((select is_admin()));

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
  group by r.rating
$$;

commit;
