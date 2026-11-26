-- German track opened to learners (permission germanTrack).
--
-- German lessons, word groups and passages are stored as DRAFTS with ids that start with "de-" (see
-- 20250360000000_german_track.sql): every learner list for English reads `status = 'published'`, so
-- keeping them drafts keeps them out of English lists, statistics, voice and translation jobs, the word
-- bank's sentence index and every other published-only read. The row-level rules, though, show a draft
-- to an admin alone. These policies ADD (policies are OR-ed, the English rules are untouched) read access
-- to the "de-" rows only, with the same free / Premium rule the published ones follow:
--
--   lessons, word_groups     the row itself is readable (its is_free flag drives the lock screen)
--   sentences                readable when the lesson is free, or free_for_all is on, or the reader has
--                            an active subscription (the same three branches as the published rule)
--   vocabulary_words         the same, through the word group
--
-- Passages are read through the service role by the app and have no learner policy to widen.
-- To undo: drop the four policies below.

begin;

drop policy if exists "German lessons are readable" on lessons;
create policy "German lessons are readable" on lessons
  for select using (id like 'de-%');

drop policy if exists "German word groups are readable" on word_groups;
create policy "German word groups are readable" on word_groups
  for select using (id like 'de-%');

drop policy if exists "German sentences follow the lesson's free or Premium rule" on sentences;
create policy "German sentences follow the lesson's free or Premium rule" on sentences
  for select using (
    sentences.lesson_id like 'de-%'
    and (
      exists (select 1 from access_settings where id = 1 and free_for_all)
      or exists (
        select 1
        from lessons
        where lessons.id = sentences.lesson_id
          and (
            lessons.is_free
            or exists (
              select 1
              from subscriptions
              where subscriptions.user_id = auth.uid()
                and subscriptions.status in ('active', 'trialing')
                and (
                  subscriptions.current_period_end is null
                  or subscriptions.current_period_end > now()
                )
            )
          )
      )
    )
  );

drop policy if exists "German words follow the group's free or Premium rule" on vocabulary_words;
create policy "German words follow the group's free or Premium rule" on vocabulary_words
  for select using (
    vocabulary_words.group_id like 'de-%'
    and (
      exists (select 1 from access_settings where id = 1 and free_for_all)
      or exists (
        select 1
        from word_groups
        where word_groups.id = vocabulary_words.group_id
          and (
            word_groups.is_free
            or exists (
              select 1
              from subscriptions
              where subscriptions.user_id = auth.uid()
                and subscriptions.status in ('active', 'trialing')
                and (
                  subscriptions.current_period_end is null
                  or subscriptions.current_period_end > now()
                )
            )
          )
      )
    )
  );

commit;
