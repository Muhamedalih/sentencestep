-- Stories Curriculum Units: coarse, one-Unit-per-Level organization for the
-- Stories catalog — deliberately not the same 3-unit/4-lesson-arc model
-- Normal uses (see 20250146000000_curriculum_units.sql). No schema change:
-- `units` and `lessons.unit_id`/`lessons.role` already exist and are
-- mode-agnostic (units.mode is the learning_mode enum, not Normal-only).
-- This migration only adds 3 rows to `units` and assigns unit_id on the
-- existing 62 published Stories lessons — no new table, no new column.
--
-- `role` is intentionally left untouched (stays null) for every Stories
-- lesson: Stories are not asked to fit the establish/build/integrate model
-- Normal lessons use.
--
-- Note on `order_index`: the brief for this migration described each of the
-- 3 Stories units as "order: 1". Taken literally that would insert three
-- rows at (mode='stories', order_index=1), which the table's own
-- unique(mode, order_index) constraint (see 20250146000000) rejects — units
-- are ordered within a mode, and a mode can't have three different units in
-- the same position. Using order_index 1/2/3 (matching each unit's level,
-- exactly how Normal's 3 units are already ordered) is the smallest change
-- that satisfies the existing constraint while preserving the intent
-- ("one coarse unit per level, in level order").
--
-- Idempotent: units upsert on their stable id; the lesson assignment is a
-- single UPDATE keyed on (mode, status, level_id), which is naturally
-- idempotent and requires no per-story id list to maintain.
begin;

insert into units (id, mode, level_id, order_index, title, objective) values
  (
    'unit-stories-1',
    'stories',
    (select id from levels where mode = 'stories' and index = 1),
    1,
    'Gentle Beginnings',
    'Short, easy stories that build reading confidence with simple, everyday scenarios.'
  ),
  (
    'unit-stories-2',
    'stories',
    (select id from levels where mode = 'stories' and index = 2),
    2,
    'New Chapters',
    'Everyday moments told with a bit more detail and narrative variety.'
  ),
  (
    'unit-stories-3',
    'stories',
    (select id from levels where mode = 'stories' and index = 3),
    3,
    'Everyday Adventures',
    'Fuller scenes with richer vocabulary and more complex situations.'
  )
on conflict (id) do update set
  mode = excluded.mode,
  level_id = excluded.level_id,
  order_index = excluded.order_index,
  title = excluded.title,
  objective = excluded.objective,
  updated_at = now();

-- Assign every currently-published Stories lesson to its level's unit, by
-- level rather than by an enumerated id list — the correct mechanism for
-- 62 lessons, and one that keeps working unchanged as new Stories are
-- published later at these same 3 levels. Archived/draft Stories are left
-- unassigned (unit_id stays null), matching "assign each *published*
-- Story."
update lessons
set unit_id = (
  select u.id from units u
  where u.mode = 'stories' and u.level_id = lessons.level_id
)
where mode = 'stories' and status = 'published';

commit;

-- Verification queries (run manually after this migration commits):
--
-- select u.title, count(l.id) from units u join lessons l on l.unit_id = u.id where u.mode = 'stories' group by u.id, u.title, u.order_index order by u.order_index;
--   -> 3 rows: Gentle Beginnings, New Chapters, Everyday Adventures, counts 21/21/20.
--
-- select count(*) from lessons where mode = 'stories' and status = 'published' and unit_id is null;
--   -> 0.
--
-- select count(*) from lessons where mode = 'stories' and role is not null;
--   -> 0 (role is deliberately never set for Stories).
