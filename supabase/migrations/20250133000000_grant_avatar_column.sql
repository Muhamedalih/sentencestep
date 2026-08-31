-- The authenticated column-write allowlist (20250111000000_lock_profile_role_column.sql)
-- only covers the columns that existed at the time it was written, and grants
-- are not automatically extended to new columns — avatar_id
-- (20250132000000_profile_avatar.sql) needs its own explicit grant here, or
-- every learner's avatar update fails with "permission denied for table
-- profiles" despite the RLS policy allowing it (RLS is only evaluated after
-- the base column-privilege check passes). Re-issuing the full allowlist
-- rather than a bare additional grant keeps one single place that lists
-- every column an authenticated learner may write to their own profile.
grant update (display_name, preferred_language, timezone, avatar_id, updated_at) on profiles to authenticated;
