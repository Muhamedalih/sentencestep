-- App-level testimonials: a signed-in learner's positive (4-5 star) rating
-- from RatingModal, kept public with their explicit consent so it can be
-- shown as a real learner quote on the marketing homepage (see the
-- Testimonials section). Deliberately separate from RatingModal's own
-- submission to the internal ratings Google Sheet
-- (src/lib/feedback/actions.ts) — that sheet stays the private, unmoderated
-- record every rating produces regardless of consent or star count; this
-- table only ever gets a row for the subset a learner agreed to make
-- public, and every row starts unpublished until an admin reviews it (see
-- Admin > Testimonials), the same "learner submits, admin decides what's
-- public" shape as problem_reports (20250212000000_problem_reports.sql).
begin;

create table app_testimonials (
  id uuid primary key default gen_random_uuid(),
  -- Kept for correlation but allowed to go null on account deletion —
  -- display_name/rating/comment below are snapshotted at submission time,
  -- so an already-published testimonial stays meaningful even if the
  -- author's account is later deleted.
  user_id uuid references auth.users (id) on delete set null,
  display_name text,
  rating smallint not null check (rating between 4 and 5),
  comment text not null check (char_length(comment) between 1 and 2000),
  locale text,
  status text not null default 'pending' check (status in ('pending', 'published', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Admin's default view is "unreviewed testimonials, newest first"; the
-- public homepage query is "published, newest first" — both hit this one
-- composite index.
create index app_testimonials_status_created_at_idx on app_testimonials (status, created_at desc);

alter table app_testimonials enable row level security;

-- A signed-in learner may submit their own testimonial only — never on
-- behalf of another user_id, and never read/update/delete anything here
-- (including their own submission; there is no learner-facing "my
-- testimonial" view today) — same insert-only shape as problem_reports.
create policy "Users can submit their own testimonial" on app_testimonials
  for insert with check (auth.uid() = user_id);

create policy "Admins manage testimonials" on app_testimonials
  for all using (is_admin()) with check (is_admin());

-- The marketing homepage reads this with the anonymous public client (same
-- reasoning as book_ratings' public SELECT policy) — never anything still
-- pending or dismissed.
create policy "Published testimonials are public to read" on app_testimonials
  for select using (status = 'published');

commit;
