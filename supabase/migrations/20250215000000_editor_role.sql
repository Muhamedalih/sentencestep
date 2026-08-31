-- Tiered admin permissions, requested after the audit flagged that
-- is_admin()/profiles.role is currently all-or-nothing — every admin can
-- touch every area, including sensitive global settings and user roles
-- themselves. Adds one narrower tier, 'editor': content authoring only
-- (lessons, sentences, levels, word lists, library books/sections,
-- categories, translations, and their cover/illustration images), never
-- voice/typing-sound/color/font/completion-theme settings, never Reports,
-- never the audit log, and never another user's role.
--
-- Every grant below is purely ADDITIVE — a brand-new "Editors manage X"
-- policy alongside each table's existing "Admins manage X" policy, never a
-- drop-and-replace of anything already working. Postgres OR's together
-- multiple permissive policies for the same command, so this simply widens
-- who can pass, with zero risk of narrowing or breaking an admin's existing
-- access if one of these statements needs to be re-run or partially applied.
begin;

-- profiles.role's original check constraint (`role in ('user', 'admin')`)
-- was never given an explicit name, so it's looked up dynamically rather
-- than assumed — same technique as 20250123000000_translation_lifecycle_foundation.sql,
-- for the same reason (guessing wrong would fail the migration).
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'profiles'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%role%user%admin%';

  if constraint_name is not null then
    execute format('alter table profiles drop constraint %I', constraint_name);
  end if;
end $$;

alter table profiles add constraint profiles_role_check check (role in ('user', 'editor', 'admin'));

-- security definer / stable, same shape as is_admin() (20250108000000_admin_cms.sql)
-- and for the same reason: avoids recursive RLS evaluation when this is used
-- inside another table's own policy.
create or replace function public.is_editor()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'editor'
  );
$$;

-- Content authoring
create policy "Editors manage lessons" on lessons
  for all using (is_editor()) with check (is_editor());
create policy "Editors manage sentences" on sentences
  for all using (is_editor()) with check (is_editor());
create policy "Editors manage levels" on levels
  for all using (is_editor()) with check (is_editor());

-- Word Lists
create policy "Editors manage word groups" on word_groups
  for all using (is_editor()) with check (is_editor());
create policy "Editors manage vocabulary words" on vocabulary_words
  for all using (is_editor()) with check (is_editor());

-- Library
create policy "Editors manage categories" on categories
  for all using (is_editor()) with check (is_editor());
create policy "Editors manage books" on books
  for all using (is_editor()) with check (is_editor());
create policy "Editors manage book categories" on book_categories
  for all using (is_editor()) with check (is_editor());
create policy "Editors manage book sections" on book_sections
  for all using (is_editor()) with check (is_editor());
create policy "Editors manage book sentences" on book_sentences
  for all using (is_editor()) with check (is_editor());

-- Translations (content_translations underlies both the Translations
-- dashboard and every content-authoring form's Spanish/Turkish fields)
create policy "Editors manage content translations" on content_translations
  for all using (is_editor()) with check (is_editor());

-- Cover/illustration images — an editor authoring a lesson or book needs to
-- upload/replace/remove its image, same as an admin already can.
create policy "Editors upload lesson illustrations" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lesson-illustrations' and is_editor());
create policy "Editors update lesson illustrations" on storage.objects
  for update to authenticated
  using (bucket_id = 'lesson-illustrations' and is_editor())
  with check (bucket_id = 'lesson-illustrations' and is_editor());
create policy "Editors delete lesson illustrations" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lesson-illustrations' and is_editor());
create policy "Editors view lesson illustrations" on storage.objects
  for select to authenticated
  using (bucket_id = 'lesson-illustrations' and is_editor());

create policy "Editors upload book covers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'book-covers' and is_editor());
create policy "Editors update book covers" on storage.objects
  for update to authenticated
  using (bucket_id = 'book-covers' and is_editor())
  with check (bucket_id = 'book-covers' and is_editor());
create policy "Editors delete book covers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'book-covers' and is_editor());

commit;
