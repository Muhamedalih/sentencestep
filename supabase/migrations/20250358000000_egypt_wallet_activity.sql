-- Vodafone Cash (Egypt): everything else the wallet's phone reports, and a balance check.
--
-- The forwarding app sends every text from Vodafone, not only the incoming transfers. A text that
-- carries Vodafone's operation number and the wallet's balance (a transfer SENT out with its service
-- fee, a payment, a recharge, anything else) is kept here as "activity": it is not money received for an
-- order, so it never activates anything, but it is the other half of the wallet's record. Together with
-- the incoming transfers (egypt_wallet_messages, which also carry the balance after them) it lets the
-- admin page check the balance: each text says what the balance was after it, so a balance that moved
-- by more than the texts explain is shown, and the admins are told once.
--
-- Operation numbers rise over time, so they order the texts even when the phone delivers them late.
--
-- Written only by server-side code with the service-role key; RLS stays enabled with a default-deny
-- posture, like the other egypt_wallet_* tables. Append-only: these rows are the wallet's record.
begin;

create table public.egypt_wallet_activity (
  id uuid primary key default gen_random_uuid(),
  -- Vodafone's own operation number: one text can never be stored twice.
  transaction_id text not null unique,
  -- 'out': a transfer sent from the wallet. 'other': any other text with an operation number and a balance.
  kind text not null check (kind in ('out', 'other')),
  -- The time written in the text (Cairo time), as an instant.
  occurred_at timestamptz not null,
  -- Null when the text is of a kind we do not read (kind 'other').
  amount_piasters integer check (amount_piasters is null or amount_piasters > 0),
  fee_piasters integer check (fee_piasters is null or fee_piasters >= 0),
  to_phone text,
  -- The wallet's balance after the operation, when the text says it.
  balance_piasters integer,
  raw_text text not null check (char_length(raw_text) <= 2000),
  seen_at timestamptz not null default now()
);

create index egypt_wallet_activity_occurred_idx
  on public.egypt_wallet_activity (occurred_at desc);

-- Which balance mismatches the admins were already told about (one alert per operation number).
create table public.egypt_wallet_balance_alerts (
  transaction_id text primary key,
  alerted_at timestamptz not null default now()
);

alter table public.egypt_wallet_activity enable row level security;
alter table public.egypt_wallet_balance_alerts enable row level security;
revoke all on public.egypt_wallet_activity from anon, authenticated;
revoke all on public.egypt_wallet_balance_alerts from anon, authenticated;

create or replace function public.egypt_wallet_activity_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'egypt_wallet_activity rows are financial records and cannot be changed or deleted';
end;
$$;

create trigger egypt_wallet_activity_guard_update
  before update on public.egypt_wallet_activity
  for each row execute function public.egypt_wallet_activity_guard();

create trigger egypt_wallet_activity_guard_delete
  before delete on public.egypt_wallet_activity
  for each row execute function public.egypt_wallet_activity_guard();

commit;
