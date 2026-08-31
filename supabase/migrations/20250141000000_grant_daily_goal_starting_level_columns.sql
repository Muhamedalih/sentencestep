-- Same gap as 20250133000000_grant_avatar_column.sql: the authenticated
-- column-write allowlist (20250111000000_lock_profile_role_column.sql) does
-- not automatically extend to new profiles columns. daily_goal and
-- starting_level (20250140000000_settings_onboarding.sql) each need their
-- own grant here, or every learner's daily-goal/starting-level update fails
-- silently — the update RPC returns no error to a caller that doesn't check
-- for one (see updateDailyGoalAction/updateStartingLevelAction/
-- setStartingLevelAction), which is exactly how this gap first surfaced:
-- caught live in Settings/onboarding testing as a write that returned 200
-- but never actually changed the row. Re-issuing the full allowlist, same
-- as that migration did, to keep one single place listing every column an
-- authenticated learner may write to their own profile.
grant update (display_name, preferred_language, timezone, avatar_id, daily_goal, starting_level, updated_at)
  on profiles to authenticated;
