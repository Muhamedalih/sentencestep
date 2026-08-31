-- Header/account redesign: a learner's chosen avatar sticker. Nullable and
-- unconstrained beyond that — the curated set of valid ids lives in
-- application code (src/lib/avatars.ts), the same way every other
-- client-defined-options field in this schema works, so adding an avatar
-- later never needs a migration. Null means "no choice made yet"; the app
-- falls back to a default sticker rather than treating null as an error.
-- Existing RLS ("Users manage their own profile", auth.uid() = id — see
-- 20250101000000_init_schema.sql) already covers this column, no new policy
-- needed.
alter table profiles add column avatar_id text;
