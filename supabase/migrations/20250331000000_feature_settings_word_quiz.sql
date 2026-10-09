-- First-rollout default for the Stories "Word quiz": Admin preview.
--
-- Same approach as 20250325000000_feature_settings_smart_words.sql and
-- 20250327000000_feature_settings_words_redesign.sql. The shipped code default
-- for every feature is "off" (a missing or unreadable settings row hides
-- everything from everyone); this gives the word quiz one entry, state
-- "admin", so an admin sees the quick pick-the-meaning question after Stories
-- sentences on the live site while every other learner keeps exactly what they
-- have. Publishing it is then one click: /admin/features -> Word quiz
-- (Stories) -> On. (Skipping this migration is safe too: the feature simply
-- stays Off until an admin picks Admin preview on that page.)
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
    '{features,wordQuiz}',
    $json${ "state": "admin" }$json$::jsonb,
    true
  ),
  updated_at = now()
where id = 1
  and not (coalesce(config -> 'features', '{}'::jsonb) ? 'wordQuiz');

commit;
