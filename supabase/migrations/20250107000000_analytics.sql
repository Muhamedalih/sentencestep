-- Milestone 10: first-party product analytics foundation.
--
-- Not user-readable — analytics is for product insight, not something an
-- ordinary user's session should ever be able to query in bulk. Only
-- server-side code using the service-role client (which bypasses RLS)
-- reads or writes this table, same posture as billing_events and
-- notification_events from Milestones 8-9.

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  event_name text not null,
  event_properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table analytics_events enable row level security;

create index analytics_events_event_name_idx on analytics_events (event_name);
create index analytics_events_user_id_idx on analytics_events (user_id);
create index analytics_events_created_at_idx on analytics_events (created_at);
