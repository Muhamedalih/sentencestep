-- Words bank («كلماتي»): a word typed right the FIRST time it is met starts two steps up.
--
-- The owner's condition for the section is that words never pile up until a learner stops reviewing.
-- The page's own rules cover most of it (five words a day, twenty being learned at once, a stable
-- word leaves the daily round: see src/lib/word-bank/shelves.ts). This is the fourth rule, and the
-- only one that lives in the database: until now every word entered the bank at strength 1 at best,
-- so a word the learner plainly knew still asked for three reviews (after 1, 3 and 7 days) before it
-- was stable. Now a word whose very first answer is clean enters at strength 2 and is first asked
-- after 3 days: two reviews to stable instead of three. A word that was missed, or typed with help,
-- enters exactly as before (strength 0, due tomorrow), and every later answer follows the same ladder
-- as before: nothing changes for a word that already has a row.
--
-- Only the function is replaced (same name, same arguments, same result columns): no table, column,
-- policy or row is touched, and running this file twice does no harm. The one changed statement is
-- the `clean` branch: `v_prev_strength + 1` became `v_prev_strength + (case when v_found then 1 else
-- 2 end)`. src/lib/word-bank/clean-start.test.ts keeps this file in step with the first migration
-- (20250350000000_learner_words.sql) and with BANK_CLEAN_START_STRENGTH.
begin;

create or replace function public.record_learner_word_review(
  p_word text,
  p_outcome text,
  p_today date,
  p_source text,
  p_ar text default '',
  p_lesson_id text default null,
  p_lesson_title text default null,
  p_home_sentence text default null
)
returns table (out_strength integer, out_due_on date, out_advanced boolean)
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
  v_strength integer;
  v_due date;
begin
  if v_user is null then
    raise exception 'record_learner_word_review needs a signed-in learner';
  end if;
  if p_outcome not in ('clean', 'assisted', 'missed') then
    raise exception 'unknown outcome: %', p_outcome;
  end if;
  if p_today is null then
    raise exception 'p_today is required';
  end if;
  if p_source not in ('story', 'passage', 'star', 'core', 'lesson') then
    raise exception 'unknown source: %', p_source;
  end if;
  if p_word is null or char_length(p_word) < 1 or char_length(p_word) > 60 then
    raise exception 'a word must be 1-60 characters';
  end if;

  -- Locks the learner's own row (if there is one) so two tabs recording the same word at once cannot
  -- both compute from the same stale strength.
  select lw.strength, lw.due_on
    into v_prev_strength, v_prev_due
  from learner_words lw
  where lw.user_id = v_user
    and lw.word = p_word
  for update;
  v_found := found;
  if not v_found then
    v_prev_strength := 0;
  end if;

  if p_outcome = 'missed' then
    v_strength := 0;
    v_due := p_today + 1;
  elsif v_found and not (v_prev_due <= p_today) then
    -- Answered early: the schedule is left exactly as it was.
    v_strength := v_prev_strength;
    v_due := v_prev_due;
  elsif p_outcome = 'clean' then
    -- A word with no row yet was typed right the first time it was met: it starts two steps up.
    v_strength := least(v_prev_strength + (case when v_found then 1 else 2 end), 5);
    v_due := p_today + v_days[v_strength];
  else
    v_strength := v_prev_strength;
    v_due := p_today + v_days[greatest(v_strength, 1)];
  end if;

  insert into learner_words as lw (
    user_id, word, strength, due_on, last_outcome, last_reviewed_on,
    reviews, clean_reviews, misses,
    source, lesson_id, lesson_title, ar, home_sentence, first_seen_on
  )
  values (
    v_user, p_word, v_strength, v_due, p_outcome, p_today,
    1,
    case when p_outcome = 'clean' then 1 else 0 end,
    case when p_outcome = 'missed' then 1 else 0 end,
    p_source,
    left(p_lesson_id, 120),
    left(p_lesson_title, 200),
    left(coalesce(p_ar, ''), 300),
    left(p_home_sentence, 400),
    p_today
  )
  on conflict (user_id, word) do update set
    strength = excluded.strength,
    due_on = excluded.due_on,
    last_outcome = excluded.last_outcome,
    last_reviewed_on = excluded.last_reviewed_on,
    reviews = lw.reviews + 1,
    clean_reviews = lw.clean_reviews + excluded.clean_reviews,
    misses = lw.misses + excluded.misses,
    -- The first meeting keeps its context; a later one only fills what was missing.
    ar = case when lw.ar = '' then excluded.ar else lw.ar end,
    lesson_id = coalesce(lw.lesson_id, excluded.lesson_id),
    lesson_title = coalesce(lw.lesson_title, excluded.lesson_title),
    home_sentence = coalesce(lw.home_sentence, excluded.home_sentence),
    updated_at = now();

  return query select v_strength, v_due, (v_strength > v_prev_strength);
end;
$$;

commit;
