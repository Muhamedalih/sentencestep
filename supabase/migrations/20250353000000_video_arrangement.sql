-- The order of the Video library («فيديو») as an Admin arranged it: which sections, in which order,
-- and which videos in each. One row (id = 'library'), written only by an admin from the library page
-- (src/lib/video-dictation/arrangement-actions.ts). With no row the library uses the order the code
-- works out by itself (comedy first, then every section easiest video first), so shipping the code
-- before this table exists, or deleting the row, only ever means "the default order".
--
-- sections is a JSON array: [{ "kind": "comedy", "ids": ["video-id", ...] }, ...]. The app checks it
-- again when it reads it (a video removed since is skipped, a new one goes to the end of its section),
-- so nothing stored here can break the page.
--
-- Not publicly readable: the server reads the table with the service role
-- (src/lib/video-dictation/arrangement-store.ts), like the rollouts table.
create table if not exists video_arrangement (
  id text primary key default 'library' check (id = 'library'),
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table video_arrangement enable row level security;

drop policy if exists "Admins manage the video arrangement" on video_arrangement;
create policy "Admins manage the video arrangement" on video_arrangement
  for all using ((select is_admin())) with check ((select is_admin()));
