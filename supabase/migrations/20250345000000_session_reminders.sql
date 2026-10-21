-- "Remind me tomorrow" on the lesson-ending screen (see src/components/learning/session-end.tsx):
-- the moment a learner's ONE reminder email is due. Choosing an hour sets (or replaces) the row,
-- "No reminder" deletes it, and the hourly cron (src/app/api/cron/session-reminders) sends the
-- email once it is due and clears what has gone stale. A single email each time, never a series,
-- and nothing is sent until SESSION_REMINDER_MAX_PER_RUN is set on the server.
--
-- One row per learner (the primary key): the screen only ever asks about tomorrow, so a newer
-- choice simply replaces the older one.
create table session_reminders (
  user_id uuid primary key references auth.users (id) on delete cascade,
  remind_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table session_reminders enable row level security;

create policy "Users manage their own session reminder" on session_reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The cron looks rows up by due time, so that is what is indexed.
create index session_reminders_remind_at_idx on session_reminders (remind_at);
