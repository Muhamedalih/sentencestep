-- Vodafone Cash (Egypt) as a way to pay (see src/lib/billing/egypt-wallet).
--
-- A learner in Egypt pressing "Pay with Vodafone Cash" gets an ordinary payment_orders row
-- (provider 'vodafone_cash', charged in whole Egyptian pounds) plus an "intent": the Vodafone Cash
-- number the learner says they will send from. Vodafone texts the receiving wallet's phone for every
-- transfer, naming the sender's number and the amount; an SMS-forwarding app on that phone posts the
-- text to /api/payments/egypt-wallet/sms, which stores every message here (whatever it says, so nothing
-- is ever lost) and links a message to an order when the sender's number and the amount both match.
-- Premium is then granted by the existing fulfill_payment_order, exactly once, like every other payment.
--
-- Everything here is written only by server-side code with the service-role key (which bypasses
-- RLS), so no policies are defined: RLS stays enabled with a default-deny posture for
-- anon/authenticated, like payment_orders.
begin;

-- The admin-edited knobs: the wallet learners pay to and the safety limits.
create table public.egypt_wallet_settings (
  id integer primary key default 1,
  -- The Vodafone Cash number learners send to; empty switches the way to pay off.
  wallet_number text not null default '' check (wallet_number = '' or wallet_number ~ '^01[0-9]{9}$'),
  -- Orders created in any rolling 24 hours before the button pauses (0 pauses it).
  daily_order_cap integer not null default 50 check (daily_order_cap between 0 and 200),
  -- When false nothing is activated by itself: every message waits for an admin.
  auto_activate boolean not null default true,
  -- How long after an order a transfer still activates it.
  late_payment_hours integer not null default 24 check (late_payment_hours between 1 and 168),
  updated_at timestamptz not null default now(),
  constraint egypt_wallet_settings_singleton check (id = 1)
);

insert into public.egypt_wallet_settings (id, wallet_number)
values (1, '01093958598')
on conflict (id) do nothing;

-- One per Vodafone Cash order: the number the learner will send from (set on the payment page, and
-- changeable until a transfer is linked).
create table public.egypt_wallet_intents (
  order_id uuid primary key references public.payment_orders (id),
  payer_phone text check (payer_phone is null or payer_phone ~ '^01[0-9]{9}$'),
  payer_phone_set_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index egypt_wallet_intents_phone_idx
  on public.egypt_wallet_intents (payer_phone)
  where payer_phone is not null;

-- Every transfer message the forwarding app has handed over. Facts are written once and never change;
-- only the link to an order (and an admin's "ignore") moves, and a linked message is final.
create table public.egypt_wallet_messages (
  id uuid primary key default gen_random_uuid(),
  -- Vodafone's own operation number: one transfer can never be stored, or paid, twice.
  transaction_id text not null unique,
  -- The time written in the message (Cairo time), as an instant.
  received_at timestamptz not null,
  amount_piasters integer not null check (amount_piasters > 0),
  -- The wallet's balance after the transfer, when the message says it.
  balance_piasters integer,
  payer_phone text,
  payer_name text,
  wallet_number text,
  -- The message exactly as received: so a message the parser got wrong can be read again.
  raw_text text not null check (char_length(raw_text) <= 2000),
  status text not null default 'new' check (status in ('new', 'linked', 'ignored')),
  linked_order_id uuid references public.payment_orders (id),
  link_method text check (link_method is null or link_method in ('phone', 'reference', 'manual')),
  link_reason text,
  seen_at timestamptz not null default now(),
  linked_at timestamptz,
  -- Set once the admins were told about a message that could not be linked.
  notified_at timestamptz,
  constraint egypt_wallet_messages_link_consistent
    check ((status = 'linked') = (linked_order_id is not null))
);

create unique index egypt_wallet_messages_one_per_order
  on public.egypt_wallet_messages (linked_order_id)
  where linked_order_id is not null;

create index egypt_wallet_messages_status_idx
  on public.egypt_wallet_messages (status, received_at desc);

create index egypt_wallet_messages_phone_idx
  on public.egypt_wallet_messages (payer_phone)
  where status = 'new';

-- Texts the forwarding app handed over that are not a readable incoming transfer (an offer from the
-- operator, a sent-money notice, or a transfer message in a shape the parser does not know). Kept so
-- nothing is silently lost; `looks_like_transfer` marks the ones an admin should look at.
create table public.egypt_wallet_unreadable (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null check (char_length(raw_text) <= 2000),
  sender text check (sender is null or char_length(sender) <= 64),
  looks_like_transfer boolean not null default false,
  seen_at timestamptz not null default now()
);

create index egypt_wallet_unreadable_seen_idx
  on public.egypt_wallet_unreadable (seen_at desc);

-- A single row: when a message last arrived (the phone's heartbeat).
create table public.egypt_wallet_state (
  id integer primary key default 1,
  last_message_at timestamptz,
  constraint egypt_wallet_state_singleton check (id = 1)
);

insert into public.egypt_wallet_state (id) values (1) on conflict (id) do nothing;

alter table public.egypt_wallet_settings enable row level security;
alter table public.egypt_wallet_intents enable row level security;
alter table public.egypt_wallet_messages enable row level security;
alter table public.egypt_wallet_unreadable enable row level security;
alter table public.egypt_wallet_state enable row level security;

revoke all on public.egypt_wallet_settings from anon, authenticated;
revoke all on public.egypt_wallet_intents from anon, authenticated;
revoke all on public.egypt_wallet_messages from anon, authenticated;
revoke all on public.egypt_wallet_unreadable from anon, authenticated;
revoke all on public.egypt_wallet_state from anon, authenticated;

-- Keeps the facts of a message immutable, a linked message final, and the table append-only:
-- these rows are the shop's record of money received.
create or replace function public.egypt_wallet_messages_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'egypt_wallet_messages rows are financial records and cannot be deleted';
  end if;

  if new.id is distinct from old.id
    or new.transaction_id is distinct from old.transaction_id
    or new.received_at is distinct from old.received_at
    or new.amount_piasters is distinct from old.amount_piasters
    or new.balance_piasters is distinct from old.balance_piasters
    or new.payer_phone is distinct from old.payer_phone
    or new.payer_name is distinct from old.payer_name
    or new.wallet_number is distinct from old.wallet_number
    or new.raw_text is distinct from old.raw_text
    or new.seen_at is distinct from old.seen_at
  then
    raise exception 'egypt_wallet_messages facts are immutable';
  end if;

  if old.status = 'linked' and (
    new.status is distinct from old.status
    or new.linked_order_id is distinct from old.linked_order_id
    or new.link_method is distinct from old.link_method
    or new.linked_at is distinct from old.linked_at
  ) then
    raise exception 'a linked Vodafone Cash message is final';
  end if;

  return new;
end;
$$;

create trigger egypt_wallet_messages_guard_update
  before update on public.egypt_wallet_messages
  for each row execute function public.egypt_wallet_messages_guard();

create trigger egypt_wallet_messages_guard_delete
  before delete on public.egypt_wallet_messages
  for each row execute function public.egypt_wallet_messages_guard();

-- Attaches one new message to one Vodafone Cash order, atomically: both rows are locked, so two
-- requests racing can never give one order two messages or one message two orders. It does NOT
-- grant Premium and does not judge amounts or numbers: the application decided that (matching.ts)
-- and then asks fulfill_payment_order, which re-checks the order against its own snapshot.
create or replace function public.link_egypt_wallet_message(
  p_message uuid,
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
  v_msg public.egypt_wallet_messages%rowtype;
  v_order public.payment_orders%rowtype;
begin
  if p_method not in ('phone', 'reference', 'manual') then
    return jsonb_build_object('result', 'bad_method');
  end if;

  select * into v_msg
  from public.egypt_wallet_messages
  where id = p_message
  for update;

  if not found then
    return jsonb_build_object('result', 'message_not_found');
  end if;

  if v_msg.status = 'linked' then
    return jsonb_build_object(
      'result', case when v_msg.linked_order_id = p_order then 'already_linked_here' else 'message_already_linked' end
    );
  end if;

  select * into v_order
  from public.payment_orders
  where id = p_order
  for update;

  if not found or v_order.provider <> 'vodafone_cash' then
    return jsonb_build_object('result', 'order_not_found');
  end if;

  if v_order.status = 'fulfilled' then
    return jsonb_build_object('result', 'order_already_paid');
  end if;

  if exists (
    select 1 from public.egypt_wallet_messages where linked_order_id = p_order
  ) then
    return jsonb_build_object('result', 'order_already_has_message');
  end if;

  update public.egypt_wallet_messages
  set status = 'linked',
      linked_order_id = p_order,
      link_method = p_method,
      link_reason = p_reason,
      linked_at = now()
  where id = p_message;

  return jsonb_build_object('result', 'linked');
end;
$$;

revoke all on function public.link_egypt_wallet_message(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.link_egypt_wallet_message(uuid, uuid, text, text)
  to service_role;

commit;
