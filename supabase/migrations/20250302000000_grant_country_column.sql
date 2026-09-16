-- Same gap as 20250141000000_grant_daily_goal_starting_level_columns.sql:
-- the authenticated column-write allowlist doesn't automatically extend to
-- new profiles columns. Without this, setCountryAction's update would
-- return no error but silently change nothing. Re-issuing the full
-- allowlist plus country, same as that migration did.
grant update (display_name, preferred_language, timezone, avatar_id, daily_goal, starting_level, country, updated_at)
  on profiles to authenticated;
