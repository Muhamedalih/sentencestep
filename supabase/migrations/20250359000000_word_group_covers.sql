-- Word Lists: a cover picture an admin chooses for each list.
--
--   word_groups.cover_url   the picture cropped to the card's 4:3 shape (800 x 600), a public URL
--                           in the 'word-covers' Storage bucket; null means "no chosen picture",
--                           and the list shows the drawing made for its topic.
--
-- Written only by an admin, from the Word Lists page itself
-- (src/app/api/admin/word-groups/[groupId]/cover/route.ts): the server makes the file from the
-- upload (src/lib/word-covers-image.ts), stores it and points the list at it. The previous file is
-- deleted afterwards.
--
-- The bucket is public (learners read the pictures as plain URLs) and takes WebP only: the server
-- re-encodes whatever an admin uploads, so nothing else is ever stored. It has no Storage
-- policies on purpose: only the server writes to it, with the service-role key, which bypasses
-- them. word_groups is already publicly readable, so the new column needs no policy either.
--
-- Additive and idempotent: nothing that exists is changed, and the code that reads the column
-- treats its absence as "no chosen picture", so shipping the code before this is applied is safe.

begin;

alter table word_groups add column if not exists cover_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('word-covers', 'word-covers', true, 2097152, array['image/webp'])
on conflict (id) do nothing;

commit;
