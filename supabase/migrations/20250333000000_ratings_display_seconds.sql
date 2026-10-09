-- How long each approved rating stays on screen in the rotating "what our
-- learners say" box (Upgrade page and the first screen a new visitor sees).
-- Run AFTER 20250332000000_ratings_display_settings.sql.
--
-- Null means "automatic": the app picks a short time for a short comment and a
-- little longer for a longer one. An admin can pin a number of seconds (1 to 30)
-- on any rating in Admin > Ratings.
--
-- Safe to run more than once.
alter table public.app_ratings
  add column if not exists display_seconds smallint
    check (display_seconds is null or display_seconds between 1 and 30);
