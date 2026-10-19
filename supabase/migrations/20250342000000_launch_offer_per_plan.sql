-- Launch offer, per plan: the bonus days can now differ by plan.
--
-- launch_offer_bonus_days (see 20250329000000_launch_offer.sql) stays the number for the
-- one-month plan, and for any plan that has no number of its own. These two optional columns
-- give the three-month and six-month plans their own number: null means "same as the one-month
-- plan" (so every offer saved before this keeps meaning exactly what it meant), 0 means
-- "no bonus on this plan", and 1 to 90 is that many extra days.
--
-- Safe to deploy the app before this runs: it falls back to reading only the two original
-- columns and treats the per-plan numbers as absent. Saving per-plan numbers from the admin
-- page needs this to have run first (the page says so if it has not).
alter table public.access_settings
  add column if not exists launch_offer_bonus_days_3m integer
    check (launch_offer_bonus_days_3m is null or launch_offer_bonus_days_3m between 0 and 90),
  add column if not exists launch_offer_bonus_days_6m integer
    check (launch_offer_bonus_days_6m is null or launch_offer_bonus_days_6m between 0 and 90);
