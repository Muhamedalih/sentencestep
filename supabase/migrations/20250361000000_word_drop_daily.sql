-- Word Drop («the falling-words typing game»): the daily challenge. Every learner gets the same words in
-- the same order on a given day (at their level), plays one two-minute round, and the best score of the
-- day is kept: one row per (day, learner). The ranking reads it two ways: the learner's own place among
-- the players of their level that day, and the countries side by side (the average best score of a
-- country's players that day, with at least two players, so one person never stands for a country).
--
-- The table is the learner's own rows only (RLS); the two read functions are security definer and give
-- back only aggregates (no user id, no name), so nobody can read another learner's row. The score is
-- trusted only as far as its own limits (the check constraints and the plausibility rules of the app);
-- it is a game, not money, and nothing else reads it.
--
-- Fully additive. The feature that writes here is the "wordDrop" entry on /admin/permissions (Admins only
-- until the owner opens it); until this migration is applied the code degrades quietly (the round is
-- played, nothing is recorded, no ranking is shown).
begin;

create table if not exists word_drop_daily (
  day date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  level integer not null check (level between 1 and 3),
  score integer not null check (score between 0 and 5000),
  accuracy integer not null check (accuracy between 0 and 100),
  wpm integer not null check (wpm between 0 and 300),
  words integer not null check (words between 0 and 400),
  -- Lower-case ISO 3166-1 alpha-2, copied from the learner's profile when the score is recorded.
  country text check (country is null or country ~ '^[a-z]{2}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (day, user_id)
);

comment on table word_drop_daily is
  'Word Drop daily challenge: the best score of each learner for each UTC day, with their level and country. Written only through record_word_drop_daily(); read back only as aggregates through word_drop_daily_board() and word_drop_daily_rank().';

create index if not exists word_drop_daily_rank_idx on word_drop_daily (day, level, score desc);

alter table word_drop_daily enable row level security;

drop policy if exists "Users read their own word drop scores" on word_drop_daily;
create policy "Users read their own word drop scores" on word_drop_daily
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users write their own word drop scores" on word_drop_daily;
create policy "Users write their own word drop scores" on word_drop_daily
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users improve their own word drop scores" on word_drop_daily;
create policy "Users improve their own word drop scores" on word_drop_daily
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Records a round for the calling learner and keeps the better score of the day. Security invoker: RLS
-- applies, so a learner can only ever touch their own row. The day must be within a day of the server's
-- own date (the app sends the UTC day it dealt the words for).
create or replace function public.record_word_drop_daily(
  p_day date,
  p_level integer,
  p_score integer,
  p_accuracy integer,
  p_wpm integer,
  p_words integer,
  p_country text default null
)
returns table (out_best integer, out_improved boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := (select auth.uid());
  v_previous integer;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;
  if p_day < (now() at time zone 'utc')::date - 1 or p_day > (now() at time zone 'utc')::date + 1 then
    raise exception 'day out of range';
  end if;

  select score into v_previous from word_drop_daily where day = p_day and user_id = v_user;

  insert into word_drop_daily (day, user_id, level, score, accuracy, wpm, words, country)
  values (p_day, v_user, p_level, p_score, p_accuracy, p_wpm, p_words, p_country)
  on conflict (day, user_id) do update
    set level = excluded.level,
        score = excluded.score,
        accuracy = excluded.accuracy,
        wpm = excluded.wpm,
        words = excluded.words,
        country = excluded.country,
        updated_at = now()
    where excluded.score > word_drop_daily.score;

  return query
    select d.score, (v_previous is null or d.score > v_previous)
    from word_drop_daily d
    where d.day = p_day and d.user_id = v_user;
end;
$$;

-- The countries side by side for one day: the average best score of a country's players (all levels),
-- only countries with at least two players. Aggregates only.
create or replace function public.word_drop_daily_board(p_day date)
returns table (country text, players integer, avg_score integer)
language sql
security definer
stable
set search_path = public
as $$
  select d.country, count(*)::integer, round(avg(d.score))::integer
  from word_drop_daily d
  where d.day = p_day and d.country is not null
  group by d.country
  having count(*) >= 2
  order by avg(d.score) desc, count(*) desc
  limit 20;
$$;

-- The calling learner's own place among the players of their level for one day: their best score, the
-- number of players with a higher score plus one, and the number of players.
create or replace function public.word_drop_daily_rank(p_day date)
returns table (my_score integer, my_rank integer, total integer)
language sql
security definer
stable
set search_path = public
as $$
  select me.score,
         (select count(*) + 1 from word_drop_daily o where o.day = p_day and o.level = me.level and o.score > me.score)::integer,
         (select count(*) from word_drop_daily o where o.day = p_day and o.level = me.level)::integer
  from word_drop_daily me
  where me.day = p_day and me.user_id = (select auth.uid());
$$;

revoke all on function public.record_word_drop_daily(date, integer, integer, integer, integer, integer, text) from public, anon;
grant execute on function public.record_word_drop_daily(date, integer, integer, integer, integer, integer, text) to authenticated;
revoke all on function public.word_drop_daily_board(date) from public, anon;
grant execute on function public.word_drop_daily_board(date) to authenticated;
revoke all on function public.word_drop_daily_rank(date) from public, anon;
grant execute on function public.word_drop_daily_rank(date) to authenticated;

commit;
