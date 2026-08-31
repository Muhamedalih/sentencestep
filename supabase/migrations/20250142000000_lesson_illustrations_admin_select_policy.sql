-- The original lesson-illustrations migration (20250112000000) granted
-- admins INSERT/UPDATE/DELETE on the `lesson-illustrations` storage bucket
-- but never SELECT — Storage's own delete/list implementation needs to be
-- able to find a row in storage.objects before it can act on it, so admin
-- deletes/lists against this bucket were failing silently without this.
-- This was applied directly to production out-of-band (see the repo root's
-- former add-storage-select-policy.sql) before being captured here as a
-- real, version-controlled migration; `drop policy if exists` keeps it safe
-- to run again. Purely additive: public reads still go through the public
-- object URL, which never needed a policy, and none of the existing
-- INSERT/UPDATE/DELETE policies are touched.
drop policy if exists "Admins view lesson illustrations" on storage.objects;

create policy "Admins view lesson illustrations" on storage.objects
  for select to authenticated
  using (bucket_id = 'lesson-illustrations' and is_admin());
