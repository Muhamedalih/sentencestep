-- Web Push subscriptions: the "no push notifications at all" gap, filled
-- with the standard Web Push API (VAPID) rather than a third-party service
-- (OneSignal, Firebase) — free, no vendor account, same self-hosted posture
-- as the rest of this app's notification pipeline (see 20250106000000's
-- email_preferences/notification_events).
--
-- One row per subscribed browser/device (a user can have several), not one
-- row per user — matching how the Push API itself works: each browser
-- generates its own endpoint/keys on subscribe, and they all need a push
-- sent independently. Opt-in state is simply "does this user have at least
-- one row here", so there's no separate boolean preference column: enabling
-- inserts a row, disabling (or the browser revoking permission, detected via
-- a 404/410 from the push service) deletes it.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage their own push subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index push_subscriptions_user_id_idx on push_subscriptions (user_id);
