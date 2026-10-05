-- Admin-controlled availability of the engagement features (dictation,
-- from-memory, personal word cards, daily session, daily quests, badges,
-- streak calendar/freeze). One row, one jsonb document — same singleton shape
-- as access_settings (20250228000000_free_for_all_access.sql). The document's
-- structure (per-feature off/admin/on state, premium-only flag, per-section
-- matrix, tunable options) is owned and validated by the application
-- (src/lib/features/config.ts sanitizeFeatureConfig), not by this schema, so
-- adding an option later never needs a migration; a missing key simply
-- resolves to the shipped default, which is "everything off".
--
-- Publicly readable on purpose: the config holds no secrets, and every
-- learner's client needs to know which features to render. Only admins can
-- write it.
begin;

create table if not exists feature_settings (
  id integer primary key default 1,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint feature_settings_singleton check (id = 1)
);

insert into feature_settings (id) values (1) on conflict (id) do nothing;

alter table feature_settings enable row level security;

create policy "Feature settings are publicly readable" on feature_settings
  for select using (true);

create policy "Admins manage feature settings" on feature_settings
  for all using ((select is_admin())) with check ((select is_admin()));

commit;
