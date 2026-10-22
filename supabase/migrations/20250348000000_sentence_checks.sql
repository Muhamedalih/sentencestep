-- Sentence bank: the record of the weekly check.
--
-- Once a week (after seven days of Today's session) the sentence bank asks ten sentences the learner
-- wrote that week, from their meaning, with nothing in front of them, and says one honest thing
-- about it: how many were remembered. This table keeps ONE row per check, so the line can be shown
-- for the week after it: no one else's numbers, no running score, no level claimed from it.
--
--   asked       how many sentences the check asked (at least five, at most ten)
--   remembered  how many of them were typed right with no help
--   written     how many sentences the learner typed in the week the check is about
--
-- Fully additive and independent of sentence_mastery (20250347000000): either can be applied first.
-- Until this migration is applied the weekly check is simply not offered (the code degrades quietly).
-- Written by the learner's own session, so row-level security keeps every row to its owner.
begin;

create table if not exists sentence_checks (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The learner-local day the check was taken ("YYYY-MM-DD"), in the learner's calendar like every
  -- other date of the sentence bank.
  checked_on date not null,
  asked integer not null check (asked between 1 and 20),
  remembered integer not null check (remembered between 0 and 20),
  written integer not null check (written >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, checked_on),
  check (remembered <= asked)
);

comment on table sentence_checks is
  'One row per weekly sentence check: how many sentences were asked (from their meaning, nothing in front of the learner), how many were typed right with no help, and how many the learner wrote that week.';

-- "The learner's latest check" is the one read; the primary key (user_id, checked_on) serves it.
alter table sentence_checks enable row level security;

drop policy if exists "Users manage their own sentence checks" on sentence_checks;
create policy "Users manage their own sentence checks" on sentence_checks
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
