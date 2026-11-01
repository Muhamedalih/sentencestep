-- Two things for Video («فيديو»), both safe to run before or after the matching code is deployed.
--
-- 1. video_timings: the times an Admin set BY HAND for one video from its practice screen (where each
--    sentence starts and where the video stops after it). One row per video. With no row, or no table,
--    the video plays with the times written in its file (src/data/videos), so shipping the code first
--    only ever means "the video's own times". sentences is a JSON array of
--    { "id", "startSeconds", "endSeconds" }, checked again when it is read (sanitizeTimings in
--    src/lib/video-dictation/timings.ts), so nothing stored here can break the page. Not publicly
--    readable: the server reads and writes it with the service role (timings-store.ts / timings-actions.ts).
--
-- 2. The one-time rating card after a finished video is saved in app_ratings with mode = 'video' (and
--    lesson_id = the video's id), like Passages' with mode = 'passages'. The app's own per-star counts
--    must leave it out, so the figure quoted on the site never moves because of one section's opinion,
--    and video_rating_distribution() counts it for Admin > Ratings' Video tab.
begin;

create table if not exists video_timings (
  video_id text primary key,
  sentences jsonb not null check (jsonb_typeof(sentences) = 'array'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table video_timings enable row level security;

drop policy if exists "Admins manage the video timings" on video_timings;
create policy "Admins manage the video timings" on video_timings
  for all using ((select is_admin())) with check ((select is_admin()));

create or replace function public.app_rating_distribution()
returns table (rating smallint, rating_count integer)
language sql
security invoker
stable
set search_path = public
as $$
  select r.rating, count(*)::integer
  from app_ratings r
  where r.status <> 'archived'
    and r.mode not in ('passages', 'video')
  group by r.rating
$$;

create or replace function public.video_rating_distribution()
returns table (rating smallint, rating_count integer)
language sql
security invoker
stable
set search_path = public
as $$
  select r.rating, count(*)::integer
  from app_ratings r
  where r.status <> 'archived'
    and r.mode = 'video'
  group by r.rating
$$;

commit;
