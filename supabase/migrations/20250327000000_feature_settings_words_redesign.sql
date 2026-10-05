-- First-rollout default for the "Word Lists redesign": Admin preview.
--
-- Same approach as 20250325000000_feature_settings_smart_words.sql. The shipped
-- code default for every feature is "off" (a missing or unreadable settings row
-- hides everything from everyone); this gives the redesign one entry, state
-- "admin", so an admin sees the new Word Lists screens on the live site while
-- every other learner keeps exactly what they have. Publishing it is then one
-- click: /admin/features -> Word Lists redesign -> On.
--
-- Idempotent and non-destructive:
--   * it only runs when the document says nothing about this feature yet, so a
--     choice an admin already saved (Off, On, premium-only...) is never
--     overwritten, and re-running it is a no-op;
--   * it sets exactly one path and leaves every other feature and option alone;
--   * omitted settings resolve to the application defaults when the document is
--     read (sanitizeFeatureConfig).
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
    '{features,wordsRedesign}',
    $json${ "state": "admin" }$json$::jsonb,
    true
  ),
  updated_at = now()
where id = 1
  and not (coalesce(config -> 'features', '{}'::jsonb) ? 'wordsRedesign');

commit;
