-- What a learner did on the Binance Pay payment page, so the admin can see for
-- each order when the page was opened, how long it stayed open, where the
-- visitor was and on what device, and whether they copied anything (see
-- src/lib/billing/binance/visits.ts).
--
-- One row per page load. The page's own browser code opens a row when the
-- instructions appear and then updates it about every 30 seconds while the page
-- is in front of the learner. Written only by server code with the service-role
-- key (which bypasses RLS), so no policies are defined: RLS stays enabled with a
-- default-deny posture for anon/authenticated, like binance_pay_transactions.
--
-- Deliberately NOT stored: the IP address, the full user agent, the exact
-- position. Only the country and (where Cloudflare provides it) the region and
-- city, the browser's time zone and language, and a short device description.
begin;

create table public.binance_pay_visits (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.payment_orders (id),
  user_id uuid not null,
  opened_at timestamptz not null default now(),
  -- The last time the page told us it was still there (or was being left).
  last_seen_at timestamptz not null default now(),
  -- Seconds the page was in front of the learner, counted by their browser.
  visible_seconds integer not null default 0 check (visible_seconds between 0 and 86400),
  -- How many times the page went to the background (switching to the Binance app, another tab...).
  leaves integer not null default 0 check (leaves between 0 and 1000),
  -- ISO 3166-1 alpha-2, lowercase (the same shape the pricing code uses).
  country text check (country is null or country ~ '^[a-z]{2}$'),
  region text check (region is null or char_length(region) <= 80),
  city text check (city is null or char_length(city) <= 80),
  time_zone text check (time_zone is null or char_length(time_zone) <= 64),
  language text check (language is null or char_length(language) <= 16),
  device text check (device is null or device in ('mobile', 'tablet', 'desktop')),
  os text check (os is null or char_length(os) <= 24),
  browser text check (browser is null or char_length(browser) <= 32),
  -- Where the learner came from (the first-touch tag, e.g. facebook), if known.
  source text check (source is null or char_length(source) <= 32),
  copied_id boolean not null default false,
  copied_code boolean not null default false,
  opened_guide boolean not null default false
);

create index binance_pay_visits_order_idx
  on public.binance_pay_visits (order_id, opened_at desc);

create index binance_pay_visits_opened_idx
  on public.binance_pay_visits (opened_at desc);

alter table public.binance_pay_visits enable row level security;

revoke all on public.binance_pay_visits from anon, authenticated;

commit;
