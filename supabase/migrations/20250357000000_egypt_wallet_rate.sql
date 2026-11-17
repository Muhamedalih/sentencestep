-- Vodafone Cash (Egypt): the dollar rate of the day.
--
-- The price in Egyptian pounds follows the day's USD/EGP rate, read once a day from a public rate
-- service by the reconcile job (see src/lib/billing/egypt-wallet/rate.ts), rounded to the nearest whole
-- pound. The rate is kept here so every order of a day uses one rate and an admin can see it, set it
-- by hand (rate_locked stops the automatic update) or give it back to the automatic update.
--
-- payment_orders.fx_rate_per_usd is a whole number, so a Vodafone Cash order stores the rounded rate
-- and a charge rounded to the nearest pound. The snapshot check is therefore relaxed for that one
-- provider only: the charge may differ from price x stored rate by the rounding of the rate (at most
-- half a pound per dollar) plus the rounding of the charge. Every other provider keeps the exact check.
begin;

alter table public.egypt_wallet_settings
  add column if not exists usd_to_egp numeric(10, 4)
    check (usd_to_egp is null or usd_to_egp between 20 and 200),
  add column if not exists rate_updated_at timestamptz,
  add column if not exists rate_source text
    check (rate_source is null or char_length(rate_source) <= 40),
  add column if not exists rate_locked boolean not null default false;

alter table public.payment_orders
  drop constraint if exists payment_orders_charge_matches_usd;

alter table public.payment_orders
  add constraint payment_orders_charge_matches_usd
  check (
    charge_amount * 100 = price_usd_cents * fx_rate_per_usd
    or (
      provider = 'vodafone_cash'
      and abs(charge_amount * 100 - price_usd_cents * fx_rate_per_usd) * 2 <= price_usd_cents + 200
    )
  );

commit;
