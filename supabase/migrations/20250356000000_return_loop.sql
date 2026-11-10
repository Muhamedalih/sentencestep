-- The return loop (src/lib/return-loop): the "Remind me tomorrow" row a learner sets by pressing a time
-- (session_reminders, one row per learner) now also remembers HOW and WHAT:
--   channel      'push' = a browser notification, 'email' = an email (the default, what every older row is);
--   lesson_*     the lesson the reminder opens (mode, id) and its title, worked out on the server when the
--                learner pressed the time, so the hourly sender needs no per-learner catalog or progress read;
--   word         one word the learner stumbled on today, if they did, named in the message.
-- Additive and nullable: nothing that reads the table today is affected, and a row without a lesson is
-- sent as the plain reminder.
alter table session_reminders
  add column if not exists channel text not null default 'email'
    check (channel in ('email', 'push')),
  add column if not exists lesson_mode text
    check (lesson_mode in ('normal', 'stories')),
  add column if not exists lesson_id text
    check (char_length(lesson_id) <= 200),
  add column if not exists lesson_title text
    check (char_length(lesson_title) <= 160),
  add column if not exists word text
    check (char_length(word) <= 40);
