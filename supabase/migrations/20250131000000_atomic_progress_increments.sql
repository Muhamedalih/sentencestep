-- Fixes a real concurrency gap in lesson/book-sentence completion: XP and
-- today's sentence tally were both written as a client-computed ABSOLUTE
-- value (read current -> add in application code -> overwrite), the same
-- shape complete_book_sentence's own migration doc comment already warned
-- against — two completions landing close together (two open tabs, a slow
-- network causing an overlapping retry) can read the same "before" value
-- and have one write clobber the other, silently losing a valid XP or
-- daily-progress increment. Streak is deliberately NOT touched here: unlike
-- XP/daily-progress, updateStreak (src/lib/progress/streak.ts) is a
-- same-day idempotent state machine — two concurrent calls that both see
-- "not yet active today" compute the exact same resulting row, so a
-- last-write-wins race can never lose data the way an additive counter can.
--
-- Both functions follow record_mistake's own established pattern exactly:
-- a single INSERT ... ON CONFLICT DO UPDATE SET x = table.x + delta,
-- letting Postgres's own row-level locking make the read-and-add atomic,
-- and deriving auth.uid() inside the function rather than trusting a
-- caller-supplied user id.
begin;

-- Returns both the pre- and post-increment total so the caller (which
-- needs "before" to detect a level-up transition) never has to take a
-- separate, race-prone read of its own — previous_xp is always exactly
-- new_xp - p_delta, true whether this call inserted the first row for this
-- user or updated an existing one.
create or replace function public.increment_xp(p_delta integer)
returns table(previous_xp integer, xp integer)
language sql
security invoker
set search_path = public
as $$
  insert into user_xp (user_id, xp, updated_at)
  values (auth.uid(), p_delta, now())
  on conflict (user_id) do update set
    xp = user_xp.xp + p_delta,
    updated_at = now()
  returning xp - p_delta, xp;
$$;

-- Same shape for today's sentence count. Keyed on (user_id, date), so a
-- new day is naturally a fresh row via the INSERT branch — no explicit
-- "reset when the date rolls over" logic needed the way the application-
-- level updateDailyProgress has, since yesterday's row is simply left
-- alone rather than reset in place. goal is deliberately left out of the
-- SET list so an existing row's goal is never overwritten by a later
-- completion the same day; p_default_goal only seeds it on first insert.
create or replace function public.increment_daily_progress(p_date date, p_delta integer, p_default_goal integer)
returns table(sentences_completed integer, goal integer)
language sql
security invoker
set search_path = public
as $$
  insert into daily_progress (user_id, date, sentences_completed, goal, updated_at)
  values (auth.uid(), p_date, p_delta, p_default_goal, now())
  on conflict (user_id, date) do update set
    sentences_completed = daily_progress.sentences_completed + p_delta,
    updated_at = now()
  returning sentences_completed, goal;
$$;

commit;
