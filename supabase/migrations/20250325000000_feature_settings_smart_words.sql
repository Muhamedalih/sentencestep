-- First-rollout default for "Smart word practice": Admin preview.
--
-- The shipped code default for every feature is still "off" (a missing or
-- unreadable settings row hides everything from everyone). This migration
-- gives the new feature one entry, state "admin", in the existing settings
-- document, so an admin can use the upgraded Word Lists practice on the live
-- site while every other learner sees exactly what they saw before. Rolling it
-- out is then one click: /admin/features -> Smart word practice -> On.
--
-- Deliberately a separate, idempotent statement (same approach as
-- 20250321000000_feature_settings_admin_preview.sql):
--   * it only runs when the document says nothing about this feature yet, so a
--     choice an admin has already saved (Off, On, premium-only...) is never
--     overwritten, and re-running it is a no-op;
--   * it sets exactly one path and leaves every other feature and option in the
--     document untouched;
--   * every omitted setting (premium-only flag, sections) resolves to the
--     application default when the document is read (sanitizeFeatureConfig).
begin;

update feature_settings
set
  config = jsonb_set(
    jsonb_set(
      coalesce(config, '{}'::jsonb),
      '{features}',
      coalesce(config -> 'features', '{}'::jsonb),
      true
    ),
    '{features,smartWords}',
    $json${ "state": "admin" }$json$::jsonb,
    true
  ),
  updated_at = now()
where id = 1
  and not (coalesce(config -> 'features', '{}'::jsonb) ? 'smartWords');

commit;
