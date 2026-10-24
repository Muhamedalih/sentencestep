-- Redeem codes: a one-time code that an agent sells for local money and a learner types on the plans
-- page to get Premium days. See docs/redeem-codes.md for the design and the rules.
--
-- *** NOT APPLIED. Written for review: nothing in the app calls these tables yet, and nothing here
-- *** is applied to production until the owner says so and pastes it into the Supabase SQL editor.
--
-- What is stored, and what is not:
--   * A code is stored ONLY as an HMAC-SHA256 (code_hash) made with a secret that lives in the
--     server's environment (REDEEM_CODE_PEPPER), never as the code itself. A copy of these tables is
--     therefore no list of free Premium. The owner sees a batch's codes once, when it is created.
--   * redeem_agents / redeem_batches / redeem_codes are the ledger: who bought how many codes of which
--     plan for how much, and which were redeemed by whom. Like payment_orders they are financial
--     records: nothing is deleted, and a redeemed code is final.
--   * redeem_attempts keeps the failed and successful tries, only so the box can pause someone who is
--     guessing (the limits are in redeem_code below and are mirrored by src/lib/redeem/constants.ts; a
--     test reads this file and fails if the numbers drift apart).
--
-- Everything is written by server code with the service-role key. RLS is on with no policies, so
-- anon and signed-in users can read and write none of it; the two functions are executable by the
-- service role only. Fully additive and idempotent.
begin;

-- Agents ---------------------------------------------------------------------------------------------

create table if not exists public.redeem_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  -- A WhatsApp number or Telegram handle. Admin eyes only.
  contact text not null default '' check (char_length(contact) <= 200),
  country text check (country is null or country ~ '^[a-z]{2}$'),
  -- candidate = being vetted (cannot buy); active = may buy; paused / ended = may not.
  status text not null default 'candidate' check (status in ('candidate', 'active', 'paused', 'ended')),
  -- Most unredeemed codes this agent may hold at once. A new agent starts at 5; the owner raises it as
  -- their codes get redeemed, so the next order can't be placed before enough of the last one is used.
  max_outstanding integer not null default 5 check (max_outstanding between 0 and 1000),
  note text not null default '' check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Batches --------------------------------------------------------------------------------------------

create table if not exists public.redeem_batches (
  id uuid primary key default gen_random_uuid(),
  -- The number the owner and the agent say out loud ("batch 12").
  batch_number integer generated always as identity unique,
  agent_id uuid not null references public.redeem_agents (id),
  -- A voided batch (a cheating agent, a leaked list) takes its unredeemed codes with it.
  status text not null default 'active' check (status in ('active', 'voided')),
  valid_until timestamptz not null,
  code_count integer not null check (code_count between 1 and 200),
  -- What the agent owed for the batch, and what the owner actually received (USD cents). The agent
  -- pays first: received must cover the price. Anything extra is a credit toward the next batch.
  wholesale_total_cents integer not null check (wholesale_total_cents > 0),
  received_cents integer not null check (received_cents >= wholesale_total_cents),
  payment_method text not null check (char_length(payment_method) between 1 and 80),
  -- The transaction id or any reference that lets the owner find the payment again.
  payment_reference text not null default '' check (char_length(payment_reference) <= 200),
  note text not null default '' check (char_length(note) <= 2000),
  -- The admin who created it. No foreign key: the record outlives the account.
  created_by uuid,
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  void_reason text check (void_reason is null or char_length(void_reason) <= 500),
  constraint redeem_batches_void_consistent check ((status = 'voided') = (voided_at is not null))
);

create index if not exists redeem_batches_agent_idx on public.redeem_batches (agent_id, created_at desc);

-- Codes ----------------------------------------------------------------------------------------------

create table if not exists public.redeem_codes (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.redeem_batches (id),
  -- 1, 2, 3 ... inside the batch: the "B12-007" that identifies a code to a human without revealing it.
  serial integer not null check (serial >= 1),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  plan_id text not null check (plan_id in ('1m', '3m', '6m')),
  days integer not null check (days > 0),
  -- What the agent paid for this code, USD cents.
  wholesale_cents integer not null check (wholesale_cents > 0),
  status text not null default 'unused' check (status in ('unused', 'redeemed', 'voided')),
  -- No foreign key on the learner: the record outlives the account, like payment_orders.
  redeemed_by uuid,
  redeemed_at timestamptz,
  redeemed_country text check (redeemed_country is null or redeemed_country ~ '^[a-z]{2}$'),
  premium_period_end timestamptz,
  voided_at timestamptz,
  unique (batch_id, serial),
  constraint redeem_codes_redeemed_consistent
    check ((status = 'redeemed') = (redeemed_by is not null and redeemed_at is not null)),
  constraint redeem_codes_voided_consistent check ((status = 'voided') = (voided_at is not null))
);

create index if not exists redeem_codes_batch_idx on public.redeem_codes (batch_id);
create index if not exists redeem_codes_redeemed_by_idx
  on public.redeem_codes (redeemed_by) where redeemed_by is not null;

-- Attempts -------------------------------------------------------------------------------------------

create table if not exists public.redeem_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  -- An HMAC of the request address made by the server, never the address itself.
  ip_hash text,
  outcome text not null
    check (outcome in ('ok', 'used_by_you', 'unlimited', 'unknown', 'used', 'voided', 'expired')),
  -- A wrong code (not found, already used, voided, expired) counts against the limits; a success or a repeat does not.
  failed boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists redeem_attempts_user_idx
  on public.redeem_attempts (user_id, created_at desc) where failed;
create index if not exists redeem_attempts_ip_idx
  on public.redeem_attempts (ip_hash, created_at desc) where failed and ip_hash is not null;

-- Row-level security: on, with no policies. Only the service role can touch any of it.
alter table public.redeem_agents enable row level security;
alter table public.redeem_batches enable row level security;
alter table public.redeem_codes enable row level security;
alter table public.redeem_attempts enable row level security;
revoke all on public.redeem_agents, public.redeem_batches, public.redeem_codes, public.redeem_attempts
  from anon, authenticated;

-- Guards: a ledger that cannot be quietly rewritten ----------------------------------------------------

create or replace function public.redeem_codes_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'redeem_codes rows are financial records and cannot be deleted';
  end if;

  if new.id is distinct from old.id
    or new.batch_id is distinct from old.batch_id
    or new.serial is distinct from old.serial
    or new.code_hash is distinct from old.code_hash
    or new.plan_id is distinct from old.plan_id
    or new.days is distinct from old.days
    or new.wholesale_cents is distinct from old.wholesale_cents
  then
    raise exception 'redeem_codes snapshot columns are immutable';
  end if;

  -- A redeemed or voided code is final.
  if old.status <> 'unused' and new is distinct from old then
    raise exception 'a redeemed or voided code is final';
  end if;

  return new;
end;
$$;

drop trigger if exists redeem_codes_guard_update on public.redeem_codes;
create trigger redeem_codes_guard_update
  before update on public.redeem_codes
  for each row execute function public.redeem_codes_guard();

drop trigger if exists redeem_codes_guard_delete on public.redeem_codes;
create trigger redeem_codes_guard_delete
  before delete on public.redeem_codes
  for each row execute function public.redeem_codes_guard();

create or replace function public.redeem_batches_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'redeem_batches rows are financial records and cannot be deleted';
  end if;

  if new.id is distinct from old.id
    or new.batch_number is distinct from old.batch_number
    or new.agent_id is distinct from old.agent_id
    or new.code_count is distinct from old.code_count
    or new.wholesale_total_cents is distinct from old.wholesale_total_cents
    or new.received_cents is distinct from old.received_cents
    or new.payment_method is distinct from old.payment_method
    or new.payment_reference is distinct from old.payment_reference
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'redeem_batches snapshot columns are immutable';
  end if;

  -- The only moves: active -> voided, a later valid_until (a courtesy to an agent with unsold stock), a note.
  if old.status = 'voided' and new is distinct from old then
    raise exception 'a voided batch is final';
  end if;
  if new.valid_until < old.valid_until then
    raise exception 'a batch can only be extended, not shortened';
  end if;

  return new;
end;
$$;

drop trigger if exists redeem_batches_guard_update on public.redeem_batches;
create trigger redeem_batches_guard_update
  before update on public.redeem_batches
  for each row execute function public.redeem_batches_guard();

drop trigger if exists redeem_batches_guard_delete on public.redeem_batches;
create trigger redeem_batches_guard_delete
  before delete on public.redeem_batches
  for each row execute function public.redeem_batches_guard();

-- Issuing a batch ------------------------------------------------------------------------------------
--
-- The server makes the codes (src/lib/redeem/generate.ts), hashes them, and hands only the hashes
-- here as [{serial, code_hash, plan_id, days, wholesale_cents}]. The dealing rules are checked again
-- here, under a lock on the agent, so two admins issuing at once cannot together pass the limit: the
-- agent pays first, a first order is at most 5 codes, an agent holds at most max_outstanding unsold
-- codes, a batch is at most 200 codes and lives 30 to 366 days.

create or replace function public.create_redeem_batch(
  p_agent_id uuid,
  p_valid_until timestamptz,
  p_received_cents integer,
  p_payment_method text,
  p_payment_reference text,
  p_note text,
  p_created_by uuid,
  p_codes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_agent public.redeem_agents%rowtype;
  v_count integer;
  v_total bigint;
  v_batches integer;
  v_outstanding integer;
  v_batch public.redeem_batches%rowtype;
begin
  select * into v_agent from public.redeem_agents where id = p_agent_id for update;
  if not found then
    return jsonb_build_object('result', 'agent_not_found');
  end if;
  if v_agent.status <> 'active' then
    return jsonb_build_object('result', 'agent_not_active');
  end if;
  if p_codes is null or jsonb_typeof(p_codes) <> 'array' then
    return jsonb_build_object('result', 'bad_request');
  end if;

  select count(*), coalesce(sum((c ->> 'wholesale_cents')::integer), 0)
    into v_count, v_total
  from jsonb_array_elements(p_codes) as c;

  if v_count < 1 or v_count > 200 then
    return jsonb_build_object('result', 'bad_size');
  end if;

  select count(*) into v_batches from public.redeem_batches where agent_id = p_agent_id;
  if v_batches = 0 and v_count > 5 then
    return jsonb_build_object('result', 'first_batch_too_big');
  end if;

  select count(*) into v_outstanding
  from public.redeem_codes c
  join public.redeem_batches b on b.id = c.batch_id
  where b.agent_id = p_agent_id
    and b.status = 'active'
    and b.valid_until > v_now
    and c.status = 'unused';
  if v_outstanding + v_count > v_agent.max_outstanding then
    return jsonb_build_object('result', 'too_many_outstanding', 'outstanding', v_outstanding);
  end if;

  if p_received_cents is null or p_received_cents < v_total then
    return jsonb_build_object('result', 'underpaid', 'owed_cents', v_total);
  end if;
  if p_valid_until is null
    or p_valid_until < v_now + interval '29 days'
    or p_valid_until > v_now + interval '366 days'
  then
    return jsonb_build_object('result', 'bad_validity');
  end if;

  insert into public.redeem_batches (
    agent_id, valid_until, code_count, wholesale_total_cents, received_cents,
    payment_method, payment_reference, note, created_by
  )
  values (
    p_agent_id, p_valid_until, v_count, v_total, p_received_cents,
    p_payment_method, coalesce(p_payment_reference, ''), coalesce(p_note, ''), p_created_by
  )
  returning * into v_batch;

  insert into public.redeem_codes (batch_id, serial, code_hash, plan_id, days, wholesale_cents)
  select v_batch.id,
         (c ->> 'serial')::integer,
         c ->> 'code_hash',
         c ->> 'plan_id',
         (c ->> 'days')::integer,
         (c ->> 'wholesale_cents')::integer
  from jsonb_array_elements(p_codes) as c;

  return jsonb_build_object(
    'result', 'created',
    'batch_id', v_batch.id,
    'batch_number', v_batch.batch_number,
    'code_count', v_count,
    'wholesale_total_cents', v_total
  );
end;
$$;

revoke all on function public.create_redeem_batch(uuid, timestamptz, integer, text, text, text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_redeem_batch(uuid, timestamptz, integer, text, text, text, uuid, jsonb)
  to service_role;

-- Redeeming a code -----------------------------------------------------------------------------------
--
-- Called by the server after it has checked the learner's session, with the signed-in learner's id
-- (never an id the browser sent) and the HMAC of the canonical code. One transaction does it all:
-- pause someone who is guessing, find the code, refuse it for a good reason, or mark it redeemed and
-- add the days to the learner's subscription. The days stack on Premium the learner still has and
-- otherwise start now, exactly as fulfill_payment_order and the admin grant do (the shared rule in
-- TypeScript is planPremiumGrant; src/lib/redeem/redemption.ts is the table this function is checked
-- against, case by case).
--
-- The tries are serialized per learner and per address with advisory locks, so a burst of parallel
-- guesses is counted one by one and cannot slip past the limits together.
--
-- Limits (mirrored in src/lib/redeem/constants.ts, guarded by a test):
--   per learner: 5 wrong codes in 10 minutes, 20 in 24 hours;   per address: 40 in 1 hour.
-- A paused try is NOT recorded, so waiting never extends the wait.

create or replace function public.redeem_code(
  p_user_id uuid,
  p_code_hash text,
  p_country text,
  p_ip_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz;
  v_limit record;
  v_one integer;
  v_wait integer := 0;
  v_code public.redeem_codes%rowtype;
  v_valid_until timestamptz;
  v_batch_status text;
  v_sub public.subscriptions%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_extended boolean := false;
  v_country text;
begin
  if p_user_id is null or p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('result', 'bad_request');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('redeem:user:' || p_user_id::text, 0));
  if p_ip_hash is not null then
    perform pg_advisory_xact_lock(hashtextextended('redeem:ip:' || p_ip_hash, 0));
  end if;
  v_now := clock_timestamp();

  -- Pause someone who is guessing.
  for v_limit in
    select * from (values
      ('user'::text, interval '10 minutes', 5),
      ('user'::text, interval '24 hours', 20),
      ('ip'::text, interval '1 hour', 40)
    ) as l (scope, win, max_failures)
  loop
    v_one := null;
    select greatest(1, ceil(extract(epoch from (a.created_at + v_limit.win - v_now))))::integer
      into v_one
    from (
      select r.created_at
      from public.redeem_attempts r
      where r.failed
        and r.created_at > v_now - v_limit.win
        and (
          (v_limit.scope = 'user' and r.user_id = p_user_id)
          or (v_limit.scope = 'ip' and p_ip_hash is not null and r.ip_hash = p_ip_hash)
        )
      order by r.created_at desc
      offset (v_limit.max_failures - 1)
      limit 1
    ) a;
    v_wait := greatest(v_wait, coalesce(v_one, 0));
  end loop;
  if v_wait > 0 then
    return jsonb_build_object('result', 'throttled', 'retry_after_seconds', v_wait);
  end if;

  v_country := case when p_country ~ '^[a-z]{2}$' then p_country else null end;

  select * into v_code from public.redeem_codes where code_hash = p_code_hash for update;
  if not found then
    insert into public.redeem_attempts (user_id, ip_hash, outcome, failed, created_at)
    values (p_user_id, p_ip_hash, 'unknown', true, v_now);
    return jsonb_build_object('result', 'unknown');
  end if;

  select b.valid_until, b.status into v_valid_until, v_batch_status
  from public.redeem_batches b where b.id = v_code.batch_id;

  if v_code.status = 'redeemed' then
    if v_code.redeemed_by = p_user_id then
      insert into public.redeem_attempts (user_id, ip_hash, outcome, failed, created_at)
      values (p_user_id, p_ip_hash, 'used_by_you', false, v_now);
      return jsonb_build_object('result', 'used_by_you', 'premium_period_end', v_code.premium_period_end);
    end if;
    insert into public.redeem_attempts (user_id, ip_hash, outcome, failed, created_at)
    values (p_user_id, p_ip_hash, 'used', true, v_now);
    return jsonb_build_object('result', 'used');
  end if;

  if v_code.status = 'voided' or v_batch_status = 'voided' then
    insert into public.redeem_attempts (user_id, ip_hash, outcome, failed, created_at)
    values (p_user_id, p_ip_hash, 'voided', true, v_now);
    return jsonb_build_object('result', 'voided');
  end if;

  if v_valid_until <= v_now then
    insert into public.redeem_attempts (user_id, ip_hash, outcome, failed, created_at)
    values (p_user_id, p_ip_hash, 'expired', true, v_now);
    return jsonb_build_object('result', 'expired');
  end if;

  -- Nobody to give the days to (the account was deleted a moment ago).
  if not exists (select 1 from auth.users where id = p_user_id) then
    return jsonb_build_object('result', 'user_not_found');
  end if;

  select * into v_sub from public.subscriptions where user_id = p_user_id for update;

  -- Premium with no end date: nothing to add, and the code stays unused for them.
  if v_sub.id is not null
    and v_sub.plan = 'premium'
    and v_sub.status in ('active', 'trialing')
    and v_sub.current_period_end is null
  then
    insert into public.redeem_attempts (user_id, ip_hash, outcome, failed, created_at)
    values (p_user_id, p_ip_hash, 'unlimited', false, v_now);
    return jsonb_build_object('result', 'unlimited');
  end if;

  if v_sub.id is not null
    and v_sub.plan = 'premium'
    and v_sub.status in ('active', 'trialing')
    and v_sub.current_period_end > v_now
  then
    v_start := coalesce(v_sub.current_period_start, v_now);
    v_end := v_sub.current_period_end + make_interval(days => v_code.days);
    v_extended := true;
  else
    v_start := v_now;
    v_end := v_now + make_interval(days => v_code.days);
  end if;

  -- cancel_at_period_end is true because a code never renews: the app reads it to show "Premium until <date>".
  insert into public.subscriptions (
    user_id, plan, status, current_period_start, current_period_end,
    cancel_at_period_end, provider, provider_customer_id, provider_subscription_id, updated_at
  )
  values (
    p_user_id, 'premium', 'active', v_start, v_end,
    true, 'agent_code', p_user_id::text, 'code:' || v_code.id::text, v_now
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

  update public.redeem_codes
  set status = 'redeemed',
      redeemed_by = p_user_id,
      redeemed_at = v_now,
      redeemed_country = v_country,
      premium_period_end = v_end
  where id = v_code.id;

  insert into public.redeem_attempts (user_id, ip_hash, outcome, failed, created_at)
  values (p_user_id, p_ip_hash, 'ok', false, v_now);

  return jsonb_build_object(
    'result', 'redeemed',
    'days', v_code.days,
    'premium_period_start', v_start,
    'premium_period_end', v_end,
    'extended_existing', v_extended
  );
end;
$$;

revoke all on function public.redeem_code(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.redeem_code(uuid, text, text, text) to service_role;

commit;
