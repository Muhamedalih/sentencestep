-- Admin-managed lesson illustrations.
--
-- Nullable by design, same as sentences.audio_url: NULL means "no admin-set
-- image yet", and the learner UI falls back to the built-in SVG scene system
-- in that case (see src/components/learning/lesson-illustration.tsx), so no
-- lesson is ever blocked on this. The bucket is created public so learners
-- can load images by URL with no auth round-trip, matching how audio_url
-- already works today (a plain, ungated external URL) — writes are the part
-- that must be gated, not reads. Reuses is_admin() from the Milestone 11
-- migration rather than duplicating that check.
alter table lessons
  add column if not exists illustration_url text;

insert into storage.buckets (id, name, public)
values ('lesson-illustrations', 'lesson-illustrations', true)
on conflict (id) do nothing;

create policy "Admins upload lesson illustrations" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lesson-illustrations' and is_admin());

create policy "Admins update lesson illustrations" on storage.objects
  for update to authenticated
  using (bucket_id = 'lesson-illustrations' and is_admin())
  with check (bucket_id = 'lesson-illustrations' and is_admin());

create policy "Admins delete lesson illustrations" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lesson-illustrations' and is_admin());
