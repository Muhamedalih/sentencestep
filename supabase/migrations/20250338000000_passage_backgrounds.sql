-- Passages: a background picture an admin chooses for each passage.
--
--   passages.poster_url      the picture cropped to the poster's 3:4 shape (600 x 800): the
--                            poster on the Passages list, on Home's card and on the lock screen
--   passages.background_url  the same picture at up to 1600 px: the soft backdrop at the top
--                            of the passage's reading page
--
-- Both are public URLs in the 'passage-backgrounds' Storage bucket, written together and
-- cleared together; null means "no picture", and the passage keeps its generated colours.
-- Admin -> Passages makes both files from one upload (src/lib/passages/background-image.ts),
-- so a learner never downloads more than the shape on screen needs.
--
-- The bucket is public (learners read the pictures as plain URLs) and takes WebP only: the
-- server re-encodes whatever an admin uploads, so nothing else is ever stored. It has no
-- Storage policies on purpose: only the server writes to it, with the service-role key (the
-- passages tables are admin-only by RLS for the same reason), and that key bypasses them.
--
-- Additive and idempotent: nothing that exists is changed.

begin;

alter table passages add column if not exists poster_url text;
alter table passages add column if not exists background_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('passage-backgrounds', 'passage-backgrounds', true, 2097152, array['image/webp'])
on conflict (id) do nothing;

commit;
