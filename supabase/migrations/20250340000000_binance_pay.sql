-- Binance Pay as a way to pay (see src/lib/billing/binance).
--
-- A learner pressing "Pay with Binance Pay" gets an ordinary payment_orders row
-- (provider 'binance_pay', charged in USDT) plus an "intent": the short code
-- (SS-XXXXX) they write in the note of the Binance transfer. A small relay server
-- outside the US reads the shop's Binance Pay history with a read-only key and
-- posts the incoming transfers to /api/payments/binance/ingest, which stores
-- them here and links a transfer to an order when its note holds the order's
-- code. Premium is then granted by the existing fulfill_payment_order, exactly
-- once, like every other payment.
--
-- Everything here is written only by server-side code with the service-role key
-- (which bypasses RLS), so no policies are defined: RLS stays enabled with a
-- default-deny posture for anon/authenticated, like payment_orders.
begin;

-- The admin-edited knobs: the account learners pay to and the safety limits.
create table public.binance_pay_settings (
  id integer primary key default 1,
  -- The Binance ID senders type in Pay > Send, shown on the payment page.
  binance_id text not null check (binance_id ~ '^[0-9]{3,20}$'),
  -- The nickname Binance shows the sender when they confirm, so they can check
  -- they are paying the right account.
  display_name text not null check (char_length(display_name) between 1 and 40),
  -- Orders created in any rolling 24 hours before the button pauses (0 pauses it).
  daily_order_cap integer not null default 10 check (daily_order_cap between 0 and 200),
  -- When false nothing is activated by itself: every transfer waits for an admin.
  auto_activate boolean not null default true,
  -- How long after an order a transfer carrying its code still activates it.
  late_payment_hours integer not null default 24 check (late_payment_hours between 1 and 168),
  updated_at timestamptz not null default now(),
  constraint binance_pay_settings_singleton check (id = 1)
);

insert into public.binance_pay_settings (id, binance_id, display_name)
values (1, '1239354913', 'User-f65e4')
on conflict (id) do nothing;

-- One per Binance Pay order: the code the learner writes in the transfer's note.
create table public.binance_pay_intents (
  order_id uuid primary key references public.payment_orders (id),
  -- Same alphabet as src/lib/billing/binance/constants.ts: no 0, O, 1, I or L.
  order_code text not null unique check (order_code ~ '^SS-[2-9A-HJKMNP-Z]{5}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Every incoming Binance Pay transfer the relay has reported. Facts are written
-- once and never change; only the link to an order (and an admin's "ignore")
-- moves, and a linked transfer is final (see the guard below).
create table public.binance_pay_transactions (
  id uuid primary key default gen_random_uuid(),
  -- Binance's own id for the transfer: one transfer can never be stored, or paid, twice.
  transaction_id text not null unique,
  transacted_at timestamptz not null,
  amount numeric(24, 8) not null check (amount > 0),
  currency text not null,
  order_type text not null,
  -- What the sender typed; free text from a stranger, bounded by the application.
  note text,
  payer_binance_id text,
  payer_name text,
  -- A small allow-list of Binance's fields; never contact details.
  raw jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'linked', 'ignored')),
  linked_order_id uuid references public.payment_orders (id),
  link_method text check (link_method is null or link_method in ('note_code', 'manual')),
  link_reason text,
  seen_at timestamptz not null default now(),
  linked_at timestamptz,
  -- Set once the admins were told about a transfer that carried a code but could not be linked.
  notified_at timestamptz,
  constraint binance_pay_transactions_link_consistent
    check ((status = 'linked') = (linked_order_id is not null))
);

-- One transfer per order: a second one can never be attached to an order that already has one.
create unique index binance_pay_transactions_one_per_order
  on public.binance_pay_transactions (linked_order_id)
  where linked_order_id is not null;

create index binance_pay_transactions_status_idx
  on public.binance_pay_transactions (status, transacted_at desc);

-- A single row: when the relay last asked, last succeeded, and what went wrong.
create table public.binance_relay_state (
  id integer primary key default 1,
  last_poll_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  constraint binance_relay_state_singleton check (id = 1)
);

insert into public.binance_relay_state (id) values (1) on conflict (id) do nothing;

alter table public.binance_pay_settings enable row level security;
alter table public.binance_pay_intents enable row level security;
alter table public.binance_pay_transactions enable row level security;
alter table public.binance_relay_state enable row level security;

revoke all on public.binance_pay_settings from anon, authenticated;
revoke all on public.binance_pay_intents from anon, authenticated;
revoke all on public.binance_pay_transactions from anon, authenticated;
revoke all on public.binance_relay_state from anon, authenticated;

-- Keeps the facts of a transfer immutable, a linked transfer final, and the
-- table append-only: these rows are the shop's record of money received.
create or replace function public.binance_pay_transactions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'binance_pay_transactions rows are financial records and cannot be deleted';
  end if;

  if new.id is distinct from old.id
    or new.transaction_id is distinct from old.transaction_id
    or new.transacted_at is distinct from old.transacted_at
    or new.amount is distinct from old.amount
    or new.currency is distinct from old.currency
    or new.order_type is distinct from old.order_type
    or new.note is distinct from old.note
    or new.payer_binance_id is distinct from old.payer_binance_id
    or new.payer_name is distinct from old.payer_name
    or new.seen_at is distinct from old.seen_at
  then
    raise exception 'binance_pay_transactions facts are immutable';
  end if;

  if old.status = 'linked' and (
    new.status is distinct from old.status
    or new.linked_order_id is distinct from old.linked_order_id
    or new.link_method is distinct from old.link_method
    or new.linked_at is distinct from old.linked_at
  ) then
    raise exception 'a linked Binance transfer is final';
  end if;

  return new;
end;
$$;

create trigger binance_pay_transactions_guard_update
  before update on public.binance_pay_transactions
  for each row execute function public.binance_pay_transactions_guard();

create trigger binance_pay_transactions_guard_delete
  before delete on public.binance_pay_transactions
  for each row execute function public.binance_pay_transactions_guard();

-- Attaches one new transfer to one Binance Pay order, atomically: both rows are
-- locked, so two requests racing can never give one order two transfers or one
-- transfer two orders. It does NOT grant Premium and does not judge amounts or
-- notes: the application decided that (matching.ts) and then asks
-- fulfill_payment_order, which re-checks the order against its own snapshot.
create or replace function public.link_binance_transaction(
  p_transaction uuid,
  p_order uuid,
  p_method text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx public.binance_pay_transactions%rowtype;
  v_order public.payment_orders%rowtype;
begin
  if p_method not in ('note_code', 'manual') then
    return jsonb_build_object('result', 'bad_method');
  end if;

  select * into v_tx
  from public.binance_pay_transactions
  where id = p_transaction
  for update;

  if not found then
    return jsonb_build_object('result', 'transfer_not_found');
  end if;

  if v_tx.status = 'linked' then
    return jsonb_build_object(
      'result', case when v_tx.linked_order_id = p_order then 'already_linked_here' else 'transfer_already_linked' end
    );
  end if;

  select * into v_order
  from public.payment_orders
  where id = p_order
  for update;

  if not found or v_order.provider <> 'binance_pay' then
    return jsonb_build_object('result', 'order_not_found');
  end if;

  if v_order.status = 'fulfilled' then
    return jsonb_build_object('result', 'order_already_paid');
  end if;

  if exists (
    select 1 from public.binance_pay_transactions where linked_order_id = p_order
  ) then
    return jsonb_build_object('result', 'order_already_has_transfer');
  end if;

  update public.binance_pay_transactions
  set status = 'linked',
      linked_order_id = p_order,
      link_method = p_method,
      link_reason = p_reason,
      linked_at = now()
  where id = p_transaction;

  return jsonb_build_object('result', 'linked');
end;
$$;

revoke all on function public.link_binance_transaction(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.link_binance_transaction(uuid, uuid, text, text)
  to service_role;

commit;
