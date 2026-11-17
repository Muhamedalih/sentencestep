-- Vodafone Cash (Egypt): "I sent the money". A learner who has sent the transfer presses a button on
-- the payment page; that is written here. If no matching transfer message arrives within a few
-- minutes, the admins are alerted once (email and push) with the learner's email, number and amount:
-- the phone may be off, or the learner sent from another number or another amount.
-- claim_alerted_at makes sure the alert is sent once per order, even when several requests race.
-- Additive and idempotent; written only by server-side code with the service-role key.
begin;

alter table public.egypt_wallet_intents
  add column if not exists claimed_paid_at timestamptz,
  add column if not exists claim_alerted_at timestamptz;

create index if not exists egypt_wallet_intents_unanswered_claims_idx
  on public.egypt_wallet_intents (claimed_paid_at)
  where claimed_paid_at is not null and claim_alerted_at is null;

commit;
