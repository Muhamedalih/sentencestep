-- One small, additive column on profiles — same pattern as starting_level
-- (see 20250140000000_settings_onboarding.sql): a lowercase ISO 3166-1
-- alpha-2 code (ad, ae, af, ...), matching CountryOnboarding's CountryCode
-- type exactly (src/lib/i18n/country-codes.ts), so it can be rendered
-- straight back through Intl.DisplayNames/flag-icons with no lookup table.
-- Null until a learner has picked one (or never sees the onboarding step at
-- all) — purely additive, changes nothing for any existing row.
begin;

alter table public.profiles
  add column if not exists country text
    check (country is null or country ~ '^[a-z]{2}$');

commit;
