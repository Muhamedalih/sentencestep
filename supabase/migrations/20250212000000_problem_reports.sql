-- "Report a problem": a learner-submitted issue report, surfaced live in
-- Admin > Reports. Deliberately its own table, not layered onto profiles or
-- an existing feedback mechanism — a report's identity is the submission
-- itself (message + page it was filed from), not tied to any other row, and
-- must outlive the reporting account if it's ever deleted (see user_id's
-- on delete set null below) so support history isn't silently lost.
begin;

create table problem_reports (
  id uuid primary key default gen_random_uuid(),
  -- Kept for correlation (e.g. looking up the reporter's other activity) but
  -- allowed to go null on account deletion — user_email is the durable
  -- record of who filed the report, snapshotted at submission time so it
  -- survives that.
  user_id uuid references auth.users (id) on delete set null,
  user_email text not null,
  -- The learner-facing path they were on when they reported (e.g. /learn/library/123),
  -- not a full URL — never store query strings/fragments that could carry
  -- sensitive tokens.
  page_path text not null,
  message text not null check (char_length(message) between 1 and 1000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Admin's default view is "unhandled reports, newest first".
create index problem_reports_status_created_at_idx on problem_reports (status, created_at desc);
create index problem_reports_user_id_idx on problem_reports (user_id);

alter table problem_reports enable row level security;

-- A signed-in learner may file a report for themselves only — never on
-- behalf of another user_id, and never read back anyone's reports (including
-- their own; there is no learner-facing "my reports" view today).
create policy "Users can submit their own problem reports" on problem_reports
  for insert with check (auth.uid() = user_id);

create policy "Admins manage problem reports" on problem_reports
  for all using (is_admin()) with check (is_admin());

commit;
