-- Replies learners send to our support emails, surfaced in Admin > Inbox.
-- Rows are written only by the inbound-email webhook (src/app/api/email/inbound),
-- which uses the service-role connection — there is deliberately no INSERT
-- policy, so a signed-in learner can never plant a row through PostgREST.
-- Admins read and triage them (status changes) through their normal session.
begin;

create table inbound_emails (
  id uuid primary key default gen_random_uuid(),
  -- The provider's id for the received message. UNIQUE so a redelivered
  -- webhook (every provider retries "at least once") can't create a second
  -- copy — the insert fails with a unique violation instead.
  provider_email_id text not null unique,
  -- RFC 5322 Message-ID header when the provider returns it; kept so replies
  -- can be threaded later without a schema change.
  message_id text,
  from_email text not null,
  from_name text,
  to_email text not null,
  subject text not null default '',
  -- Plain text only, capped by the webhook. HTML bodies are never stored or
  -- rendered: this is untrusted mail from the open internet.
  body_text text not null default '',
  attachment_names text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin's default view is "everything not archived, newest first".
create index inbound_emails_status_received_at_idx on inbound_emails (status, received_at desc);

alter table inbound_emails enable row level security;

create policy "Admins manage inbound emails" on inbound_emails
  for all using (is_admin()) with check (is_admin());

commit;
