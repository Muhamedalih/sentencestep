-- First-rollout default for the engagement features: "Admin preview".
--
-- The shipped code default is still "everything off" (a missing or unreadable
-- settings row hides every feature from everyone). This migration puts the
-- freshly created, never-saved settings row into "admin" for all seven
-- features instead, so an admin can try each of them on the live site while
-- every other learner sees nothing at all. Switching a feature to On (or back
-- to Off) is then a click on /admin/features.
--
-- Deliberately a separate, idempotent statement rather than an edit of
-- 20250315000000_feature_settings.sql, so it works whether or not that
-- migration was already applied:
--   * it only touches a row whose config is still the untouched empty default
--     ('{}'), so a configuration an admin has already saved is never
--     overwritten, and re-running it is a no-op;
--   * every omitted setting (premium-only flag, per-section matrix, options)
--     resolves to the application default when the document is read
--     (sanitizeFeatureConfig), so only the states need to be spelled out.
begin;

update feature_settings
set
  config = $json${
    "features": {
      "dictation": { "state": "admin" },
      "fromMemory": { "state": "admin" },
      "personalCards": { "state": "admin" },
      "dailySession": { "state": "admin" },
      "quests": { "state": "admin" },
      "badges": { "state": "admin" },
      "streakCalendar": { "state": "admin" }
    }
  }$json$::jsonb,
  updated_at = now()
where id = 1
  and config = '{}'::jsonb;

commit;
