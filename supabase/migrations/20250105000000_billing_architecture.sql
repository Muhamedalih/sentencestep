-- Milestone 8: billing architecture. Still no payment provider connected —
-- this only rounds out the schema so a real provider's webhooks have
-- somewhere correct to write, and adds the idempotency ledger that makes
-- duplicate webhook deliveries safe once one exists.

alter type subscription_status add value if not exists 'expired';

alter table subscriptions
  add column if not exists current_period_start timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

-- Guards against two rows ever claiming the same provider subscription.
create unique index if not exists subscriptions_provider_subscription_id_key
  on subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;

-- Idempotency ledger for webhook deliveries: the provider's own event id is
-- the primary key, so a duplicate delivery fails the insert with a unique
-- violation rather than being processed twice — see
-- src/lib/billing/webhook-events.ts. Only ever written by server-side
-- webhook processing using the service-role key (which bypasses RLS
-- entirely), so no policies are defined here — RLS stays enabled with a
-- default-deny posture for the anon/authenticated roles.
create table billing_events (
  id text primary key,
  provider text not null,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table billing_events enable row level security;
