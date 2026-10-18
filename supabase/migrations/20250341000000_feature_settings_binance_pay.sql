-- First-rollout default for Binance Pay: Admin preview.
--
-- Same approach as 20250336000000_feature_settings_passages.sql. The shipped code
-- default for every feature is "off" (a missing or unreadable settings row hides
-- everything from everyone); this gives Binance Pay one entry, state "admin", so
-- only an admin sees the "Pay with Binance Pay" button on the live site while
-- every other learner keeps exactly what they have. Opening it to everyone is then
-- one click: /admin/features -> Binance Pay -> On. (Skipping this migration is
-- safe too: the button simply stays Off until an admin picks Admin preview.)
--
-- Idempotent and non-destructive:
--   * it only runs when the document says nothing about this feature yet, so a
--     choice an admin already saved (Off, On...) is never overwritten, and
--     re-running it is a no-op;
--   * it sets exactly one path and leaves every other feature and option alone.
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
    '{features,binancePay}',
    $json${ "state": "admin" }$json$::jsonb,
    true
  ),
  updated_at = now()
where id = 1
  and not (coalesce(config -> 'features', '{}'::jsonb) ? 'binancePay');

commit;
