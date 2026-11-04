-- Videos a learner has finished («فيديو»): the one number Home's achievements panel needs and nothing
-- stored before, because the practice screen only ever saved mistakes.
--
-- One row per (learner, video), written when the finish screen is reached: finishing the same video
-- again changes nothing (the insert ignores the duplicate), so the count is "videos finished", never
-- "times finished". The count starts the day the code that writes here is published; videos finished
-- before then are not in it (nothing recorded them).
--
-- Fully additive and safe to run before or after the matching code is deployed: until the table exists
-- the code records nothing and Home leaves the tile out. The learner reads and writes only their own
-- rows (row level security); nothing else reads this table. The write is attempted only while the
-- "homeCards" permission is open for the caller (Admins only for now), so the table stays empty for
-- everyone else until the owner opens it.
begin;

create table if not exists video_finishes (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The video's id as written in src/data/videos (a short slug, never user input).
  video_id text not null check (char_length(video_id) between 1 and 120),
  finished_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

comment on table video_finishes is
  'Videos a learner has finished (the finish screen of Video dictation was reached), one row per learner and video. Read by Home''s achievements panel (a count) and written by recordVideoFinishAction.';

alter table video_finishes enable row level security;

drop policy if exists "Learners read their own video finishes" on video_finishes;
create policy "Learners read their own video finishes" on video_finishes
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Learners record their own video finishes" on video_finishes;
create policy "Learners record their own video finishes" on video_finishes
  for insert with check ((select auth.uid()) = user_id);

grant select, insert on video_finishes to authenticated;

commit;
