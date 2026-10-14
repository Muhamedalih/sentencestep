-- Lets payment_orders record where a checkout's pricing country came from when
-- the site is served from our own server behind Cloudflare, not only from
-- Netlify. The new value is 'cloudflare_geo'.
--
-- Purely additive: it only WIDENS the allowed values of one snapshot column's
-- check constraint. No row is read, changed or rewritten, every existing
-- 'netlify_geo' / 'default' row still satisfies the new constraint, and the
-- immutability trigger (payment_orders_guard) is not involved because no UPDATE
-- happens. Safe to apply while the site is live, and safe to apply BEFORE the
-- code that writes the new value is deployed (nothing writes it until then).
--
-- The old constraint was declared inline on the column, so its name is
-- generated; it is looked up by definition instead of assumed.

do $$
declare
  existing record;
begin
  for existing in
    select conname
    from pg_constraint
    where conrelid = 'public.payment_orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%pricing_country_source%'
  loop
    execute format('alter table public.payment_orders drop constraint %I', existing.conname);
  end loop;
end
$$;

alter table public.payment_orders
  add constraint payment_orders_pricing_country_source_check
  check (pricing_country_source in ('netlify_geo', 'cloudflare_geo', 'default'));
