-- One-time payment orders. Every checkout writes one row here before the
-- provider is ever called, so each payment has a complete, immutable
-- snapshot of exactly what was priced and charged: the learner, the pricing
-- tier and country it was resolved from, the USD price, the fixed exchange
-- rate, the amount actually charged, the provider and its ids.
--
-- user_id deliberately has no foreign key to auth.users: orders are financial
-- records that must survive account deletion (deleteAccountAction), and a
-- cascading delete would be blocked by the immutability trigger below anyway.
--
-- Written only by server-side payment code using the service-role key (which
-- bypasses RLS), so no policies are defined: RLS stays enabled with a
-- default-deny posture for anon/authenticated.

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- Our unique id for the order, sent to the provider as its referenceId.
  reference_id text not null unique,
  provider text not null,
  provider_env text not null check (provider_env in ('live', 'test')),
  -- The provider's own id for the payment link; set once, after it is created.
  provider_payment_id text unique,

  -- Snapshot, never changed after insert (see payment_orders_guard).
  pricing_tier text not null check (pricing_tier in ('A', 'B')),
  pricing_country text check (pricing_country is null or pricing_country ~ '^[a-z]{2}$'),
  pricing_country_source text not null check (pricing_country_source in ('netlify_geo', 'default')),
  price_usd_cents integer not null check (price_usd_cents > 0),
  fx_rate_per_usd integer not null check (fx_rate_per_usd > 0),
  charge_amount integer not null,
  charge_currency text not null,
  premium_days integer not null check (premium_days > 0),

  status text not null default 'created'
    check (status in ('created', 'pending', 'fulfilled', 'failed', 'cancelled', 'expired', 'needs_review')),
  provider_status text,
  checkout_url text,
  link_expires_at timestamptz,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  premium_period_start timestamptz,
  premium_period_end timestamptz,
  failure_reason text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payment_orders_charge_matches_usd
    check (charge_amount * 100 = price_usd_cents * fx_rate_per_usd),
  constraint payment_orders_iqd_minimum
    check (charge_currency <> 'IQD' or charge_amount >= 1000)
);

create index payment_orders_user_id_created_at_idx
  on public.payment_orders (user_id, created_at desc);

create index payment_orders_open_idx
  on public.payment_orders (created_at)
  where status in ('created', 'pending');

alter table public.payment_orders enable row level security;
revoke all on public.payment_orders from anon, authenticated;

-- Keeps the snapshot immutable and a fulfilled order final. Only status,
-- provider details and timestamps are ever allowed to move, and a fulfilled
-- order may only record newer provider observations (e.g. a later refund).
create or replace function public.payment_orders_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'payment_orders rows are financial records and cannot be deleted';
  end if;

  if new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.reference_id is distinct from old.reference_id
    or new.provider is distinct from old.provider
    or new.provider_env is distinct from old.provider_env
    or new.pricing_tier is distinct from old.pricing_tier
    or new.pricing_country is distinct from old.pricing_country
    or new.pricing_country_source is distinct from old.pricing_country_source
    or new.price_usd_cents is distinct from old.price_usd_cents
    or new.fx_rate_per_usd is distinct from old.fx_rate_per_usd
    or new.charge_amount is distinct from old.charge_amount
    or new.charge_currency is distinct from old.charge_currency
    or new.premium_days is distinct from old.premium_days
    or new.created_at is distinct from old.created_at
  then
    raise exception 'payment_orders snapshot columns are immutable';
  end if;

  if old.provider_payment_id is not null
    and new.provider_payment_id is distinct from old.provider_payment_id
  then
    raise exception 'payment_orders.provider_payment_id can only be set once';
  end if;

  if old.status = 'fulfilled' and (
    new.status is distinct from old.status
    or new.provider_payment_id is distinct from old.provider_payment_id
    or new.checkout_url is distinct from old.checkout_url
    or new.link_expires_at is distinct from old.link_expires_at
    or new.paid_at is distinct from old.paid_at
    or new.fulfilled_at is distinct from old.fulfilled_at
    or new.premium_period_start is distinct from old.premium_period_start
    or new.premium_period_end is distinct from old.premium_period_end
  ) then
    raise exception 'a fulfilled payment order is final';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger payment_orders_guard_update
  before update on public.payment_orders
  for each row execute function public.payment_orders_guard();

create trigger payment_orders_guard_delete
  before delete on public.payment_orders
  for each row execute function public.payment_orders_guard();

-- Grants premium for a verified payment exactly once. The order row is locked
-- for the whole transaction, so a webhook, the return page and the reconcile
-- job racing each other can never extend premium twice. The caller has
-- already verified the payment with the provider; this re-checks the amount,
-- currency and provider id against the order's own snapshot before touching
-- any access, and days stack on top of any premium the learner still has.
create or replace function public.fulfill_payment_order(
  p_reference_id text,
  p_provider_payment_id text,
  p_charge_amount integer,
  p_charge_currency text,
  p_paid_at timestamptz,
  p_provider_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders%rowtype;
  v_sub public.subscriptions%rowtype;
  v_now timestamptz := now();
  v_start timestamptz;
  v_end timestamptz;
begin
  select * into v_order
  from public.payment_orders
  where reference_id = p_reference_id
  for update;

  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  if v_order.status = 'fulfilled' then
    return jsonb_build_object(
      'result', 'already_fulfilled',
      'premium_period_end', v_order.premium_period_end
    );
  end if;

  if v_order.status = 'needs_review' then
    return jsonb_build_object('result', 'needs_review');
  end if;

  if p_paid_at is null then
    return jsonb_build_object('result', 'missing_paid_at');
  end if;

  if p_charge_amount is distinct from v_order.charge_amount
    or p_charge_currency is distinct from v_order.charge_currency
    or (
      v_order.provider_payment_id is not null
      and p_provider_payment_id is distinct from v_order.provider_payment_id
    )
  then
    update public.payment_orders
    set status = 'needs_review',
        failure_reason = 'fulfillment_mismatch',
        provider_status = p_provider_status,
        last_verified_at = v_now
    where id = v_order.id;
    return jsonb_build_object('result', 'mismatch');
  end if;

  -- The learner deleted their account after paying: nobody to grant access to.
  if not exists (select 1 from auth.users where id = v_order.user_id) then
    update public.payment_orders
    set status = 'needs_review',
        failure_reason = 'user_not_found',
        provider_status = p_provider_status,
        paid_at = p_paid_at,
        last_verified_at = v_now
    where id = v_order.id;
    return jsonb_build_object('result', 'user_not_found');
  end if;

  select * into v_sub
  from public.subscriptions
  where user_id = v_order.user_id
  for update;

  if v_sub.id is not null
    and v_sub.plan = 'premium'
    and v_sub.status in ('active', 'trialing')
    and v_sub.current_period_end is not null
    and v_sub.current_period_end > v_now
  then
    v_start := coalesce(v_sub.current_period_start, v_now);
    v_end := v_sub.current_period_end + make_interval(days => v_order.premium_days);
  else
    v_start := v_now;
    v_end := v_now + make_interval(days => v_order.premium_days);
  end if;

  -- cancel_at_period_end is true because a one-time payment never renews:
  -- the app uses it to show "premium until <date>".
  insert into public.subscriptions (
    user_id, plan, status, current_period_start, current_period_end,
    cancel_at_period_end, provider, provider_customer_id, provider_subscription_id, updated_at
  )
  values (
    v_order.user_id, 'premium', 'active', v_start, v_end,
    true, v_order.provider, v_order.user_id::text, v_order.reference_id, v_now
  )
  on conflict (user_id) do update set
    plan = excluded.plan,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    provider = excluded.provider,
    provider_customer_id = excluded.provider_customer_id,
    provider_subscription_id = excluded.provider_subscription_id,
    updated_at = excluded.updated_at;

  update public.payment_orders
  set status = 'fulfilled',
      provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
      provider_status = p_provider_status,
      paid_at = p_paid_at,
      fulfilled_at = v_now,
      premium_period_start = v_start,
      premium_period_end = v_end,
      last_verified_at = v_now,
      failure_reason = null
  where id = v_order.id;

  return jsonb_build_object('result', 'fulfilled', 'premium_period_end', v_end);
end;
$$;

revoke all on function public.fulfill_payment_order(text, text, integer, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.fulfill_payment_order(text, text, integer, text, timestamptz, text)
  to service_role;
