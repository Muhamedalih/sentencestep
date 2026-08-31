-- Admin-managed book cover images — same convention as
-- 20250112000000_lesson_illustrations.sql, adapted to books.cover_image_url
-- (already nullable, added in 20250127000000_library_foundation.sql).
--
-- A separate bucket from lesson-illustrations rather than reusing it: paths
-- are keyed by content id per bucket (bookId/uuid.ext, same as
-- lessonId/uuid.ext), and books and lessons are unrelated tables with
-- independent lifecycles, so sharing one bucket would only entangle their
-- cleanup paths for no benefit. Same public-bucket + admin-only-write shape
-- as lesson-illustrations: learners read cover_image_url as a plain public
-- URL, no auth round-trip; only admins may write.
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

create policy "Admins upload book covers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'book-covers' and is_admin());

create policy "Admins update book covers" on storage.objects
  for update to authenticated
  using (bucket_id = 'book-covers' and is_admin())
  with check (bucket_id = 'book-covers' and is_admin());

create policy "Admins delete book covers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'book-covers' and is_admin());
