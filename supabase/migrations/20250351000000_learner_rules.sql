-- Rule of the day («قاعدة اليوم»): one row per (learner, grammar rule of the A1 ladder).
--
-- A rule enters the table with its first answer and then moves through the same ladder as a word
-- (1 / 3 / 7 / 16 / 30 days; a miss comes back tomorrow). A rule is "held" from strength 3, that is
-- three clean answers on three different days. The ladder itself is text in
-- src/lib/daily-rule/ladder.ts, so the id is a short string ("a1-04"), not a foreign key.
--
-- Fully additive: nothing existing is altered. The feature that writes here is the "dailyRule" entry on
-- /admin/permissions (Admins only until the owner opens it). Until this migration is applied the code
-- degrades quietly: nothing is recorded and the card still teaches, Today keeps its tasks.
--
-- Dates are plain `date`s in the LEARNER's calendar, as in learner_words.
begin;

create table if not exists learner_rules (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The ladder id, e.g. "a1-04". Short on purpose: the ladder is code, not data.
  rule_id text not null check (char_length(rule_id) between 4 and 12),
  -- 0 = new or just missed ... 5 = passed the 30-day review. Held from 3 (see the header).
  strength integer not null default 0 check (strength between 0 and 5),
  due_on date not null,
  last_outcome text not null check (last_outcome in ('clean', 'assisted', 'missed')),
  last_reviewed_on date not null,
  reviews integer not null default 0,
  clean_reviews integer not null default 0,
  misses integer not null default 0,
  first_seen_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, rule_id)
);

comment on table learner_rules is
  'Per-learner rule of the day: the A1 grammar ladder, each rule with strength 0-5 and the learner-local day it is next due. A row exists only after the first answer. Written only through record_learner_rule_review().';

create index if not exists learner_rules_due_idx on learner_rules (user_id, due_on);

alter table learner_rules enable row level security;

drop policy if exists "Users manage their own learner rules" on learner_rules;
create policy "Users manage their own learner rules" on learner_rules
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Records one answer to one rule and returns where that leaves it.
--
-- p_outcome:
--   'clean'    right at once with no help: one step up when the rule was due, next review after that step.
--   'assisted' right after a try or with the first letter: holds its strength, comes back after its interval.
--   'missed'   wrong twice, or given up: strength 0, due tomorrow. Always recorded, due or not.
--
-- An answer before the rule is due changes nothing, and a second answer on the same learner-local day
-- changes nothing either: one afternoon cannot climb the ladder.
--
-- Mirrors src/lib/daily-rule/schedule.ts (applyRuleOutcome) statement for statement; schedule.test.ts
-- reads this file and checks the ladder and the early-answer rule are still the same.
--
-- security invoker: RLS applies, so a learner can only touch their own rows, and auth.uid() is the
-- only identity trusted.
create or replace function public.record_learner_rule_review(
  p_rule text,
  p_outcome text,
  p_today date
)
returns table (out_strength integer, out_due_on date)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_days constant integer[] := array[1, 3, 7, 16, 30];
  v_user uuid := auth.uid();
  v_found boolean;
  v_prev_strength integer := 0;
  v_prev_due date;
  v_prev_seen date;
  v_strength integer;
  v_due date;
begin
  if v_user is null then
    raise exception 'record_learner_rule_review needs a signed-in learner';
  end if;
  if p_outcome not in ('clean', 'assisted', 'missed') then
    raise exception 'unknown outcome: %', p_outcome;
  end if;
  if p_today is null then
    raise exception 'p_today is required';
  end if;
  if p_rule is null or char_length(p_rule) not between 4 and 12 then
    raise exception 'a rule id is 4-12 characters';
  end if;

  -- Locks the learner's own row (if there is one) so two tabs answering the same rule cannot both
  -- compute from the same stale strength.
  select lr.strength, lr.due_on, lr.last_reviewed_on
    into v_prev_strength, v_prev_due, v_prev_seen
  from learner_rules lr
  where lr.user_id = v_user
    and lr.rule_id = p_rule
  for update;
  v_found := found;

  -- The same rule answered again on the same day counts once.
  if v_found and v_prev_seen = p_today then
    return query select v_prev_strength, v_prev_due;
    return;
  end if;
  if not v_found then
    v_prev_strength := 0;
  end if;

  if p_outcome = 'missed' then
    v_strength := 0;
    v_due := p_today + 1;
  elsif v_found and v_prev_due > p_today then
    -- Answered before it is due: the schedule is left exactly as it was.
    v_strength := v_prev_strength;
    v_due := v_prev_due;
  elsif p_outcome = 'clean' then
    v_strength := least(v_prev_strength + 1, 5);
    v_due := p_today + v_days[v_strength];
  else
    v_strength := v_prev_strength;
    v_due := p_today + v_days[greatest(v_strength, 1)];
  end if;

  insert into learner_rules as lr (
    user_id, rule_id, strength, due_on, last_outcome, last_reviewed_on,
    reviews, clean_reviews, misses, first_seen_on
  )
  values (
    v_user, p_rule, v_strength, v_due, p_outcome, p_today,
    1,
    case when p_outcome = 'clean' then 1 else 0 end,
    case when p_outcome = 'missed' then 1 else 0 end,
    p_today
  )
  on conflict (user_id, rule_id) do update set
    strength = excluded.strength,
    due_on = excluded.due_on,
    last_outcome = excluded.last_outcome,
    last_reviewed_on = excluded.last_reviewed_on,
    reviews = lr.reviews + 1,
    clean_reviews = lr.clean_reviews + excluded.clean_reviews,
    misses = lr.misses + excluded.misses,
    updated_at = now();

  return query select v_strength, v_due;
end;
$$;

commit;
