-- Launch offer: a number of bonus days added to every purchase until a date,
-- set by an admin at /admin/free-access. It lives on the same single row as the
-- sitewide free-access switch so there is one place to look.
--
-- Both columns are optional in spirit: zero bonus days (the default) or no end
-- date means there is no offer. The row is already publicly readable and only
-- admins can change it (see 20250228000000_free_for_all_access.sql), which is
-- exactly right here: the offer is shown on /upgrade, and it is applied only by
-- server-side checkout code when an order is created, never by the browser.
--
-- Safe to deploy the app before this runs: the app reads these two columns in
-- its own guarded query and treats any error as "no offer".
alter table public.access_settings
  add column if not exists launch_offer_bonus_days integer not null default 0
    check (launch_offer_bonus_days between 0 and 90),
  add column if not exists launch_offer_ends_on date;
