-- Phase 6 (Turkish onboarding), infrastructure-only step: registers "tr" as
-- a known locale and widens the one remaining hardcoded ar/es constraint
-- that TypeScript's SupportLocale-union widening (src/lib/i18n/locales.ts)
-- surfaced — profiles.preferred_language's check constraint, previously
-- widened from ('ar','en') to ('ar','es') by 20250122000000_locale_foundation.sql,
-- the same way, one more time.
--
-- This does NOT make Turkish available to learners. `enabled = false` below
-- is the actual gate — nothing in the learner-facing UI offers Turkish
-- until SUPPORT_LOCALES (src/lib/i18n/locales.ts, a separate, deliberately
-- narrower list than SupportLocale) is updated to include it, which is a
-- distinct, later, explicit decision after content review — see that
-- file's own doc comment. Widening the constraint now, while it's provably
-- unreachable (no code path can currently write preferred_language='tr'),
-- is what closes the type-safety gap cleanly instead of leaving a
-- known-but-deferred mismatch between the TypeScript type and the database
-- constraint.

insert into locales (code, display_name, native_name, dir, enabled) values
  ('tr', 'Turkish', 'Türkçe', 'ltr', false)
on conflict (code) do nothing;

alter table profiles drop constraint profiles_preferred_language_check;
alter table profiles add constraint profiles_preferred_language_check
  check (preferred_language in ('ar', 'es', 'tr'));
