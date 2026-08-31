-- Admin audit log — "who changed what, when" across the CMS, requested
-- explicitly after the audit flagged that no admin action left any trace of
-- who performed it. Append-only by construction, not just convention: only
-- SELECT and INSERT policies exist below, so even an admin session using the
-- app's normal client can never UPDATE or DELETE a row through PostgREST —
-- a real audit trail has to survive the very account it's watching. Only a
-- service-role connection (outside the app entirely) could ever alter it.
begin;

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  -- Kept for correlation but allowed to go null on account deletion —
  -- admin_email is the durable record of who acted, snapshotted at write
  -- time, same rationale as problem_reports.user_email.
  admin_id uuid references auth.users (id) on delete set null,
  admin_email text not null,
  -- Dot-namespaced verb, e.g. "lesson.archived", "book.bulk_restored",
  -- "voice_settings.updated", "profile.role_changed" — free text rather
  -- than an enum, since this list grows every time a new admin action is
  -- instrumented and a migration per new action would be unworkable.
  action text not null,
  -- What kind of thing was acted on, e.g. "lesson", "book", "word_group",
  -- "level", "report", "voice_settings", "profile" — lets the log page
  -- filter by area without parsing `action`.
  entity_type text not null,
  -- Null for an action with no single subject (a settings save) or a bulk
  -- action recording its ids in metadata instead.
  entity_id text,
  -- Free-form extra context: what changed, previous/new values, or bulk
  -- action ids — deliberately jsonb rather than more columns, since what's
  -- worth recording differs per action.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_at_idx on admin_audit_log (created_at desc);
create index admin_audit_log_entity_type_idx on admin_audit_log (entity_type, created_at desc);

alter table admin_audit_log enable row level security;

create policy "Admins can read the audit log" on admin_audit_log
  for select using (is_admin());

create policy "Admins can write to the audit log" on admin_audit_log
  for insert with check (is_admin());

commit;
