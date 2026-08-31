-- Curriculum Units: adds a lightweight Unit layer between Level and Lesson
-- (Level -> Unit -> Lesson -> Sentence), per the SentenceStep Curriculum
-- Architecture audit. A Unit groups a small run of lessons around one
-- objective, with each lesson's `role` (establish/build/integrate) marking
-- what job it plays in that arc. Read-only for learners, admin-managed like
-- levels/lessons (same is_admin() RLS pattern as 20250108000000_admin_cms.sql).
--
-- Scoped strictly to metadata: no lesson/sentence content, ids, or
-- order_index values are touched anywhere in this file.
--
-- Idempotent: the units table upserts on its stable id (same convention as
-- lessons/sentences elsewhere), and the lesson assignments below are plain
-- updates keyed on existing lesson ids — running this migration twice is a
-- no-op.
begin;

-- `level_id` (a FK to `levels`, exactly like `lessons.level_id`) rather than
-- a raw level-index column — reuses the project's one existing
-- representation of "which level" instead of introducing a second one that
-- could drift from it.
create table if not exists units (
  id text primary key,
  mode learning_mode not null,
  level_id uuid not null references levels (id) on delete restrict,
  order_index integer not null,
  title text not null,
  objective text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mode, order_index)
);

create index if not exists units_mode_idx on units (mode);
create index if not exists units_level_id_idx on units (level_id);

-- Nullable: a lesson isn't required to belong to a unit (Stories/Conversation
-- content, and any future Normal lesson, can stay unassigned until an admin
-- places it). `on delete set null` rather than `restrict` — deleting a unit
-- should never be blocked by lessons that can simply fall back to
-- unassigned, and there is no admin UI yet that needs a delete guard here
-- (see the Milestone report this shipped with for the intentionally
-- narrow scope).
alter table lessons
  add column if not exists unit_id text references units (id) on delete set null,
  add column if not exists role text check (role in ('establish', 'build', 'integrate'));

create index if not exists lessons_unit_id_idx on lessons (unit_id);

alter table units enable row level security;

create policy "Units are publicly readable" on units for select using (true);
create policy "Admins manage units" on units
  for all using (is_admin()) with check (is_admin());

-- --- Seed: the 3 Normal-mode Units the audit identified as already latent
-- in the existing 12 published lessons, and each lesson's role within its
-- unit. Nothing here changes a lesson's title, description, sentences, id,
-- level, or order_index — unit_id/role are the only columns touched. ---

insert into units (id, mode, level_id, order_index, title, objective) values
  (
    'unit-normal-1',
    'normal',
    (select id from levels where mode = 'normal' and index = 1),
    1,
    'Everyday Mishap → Resolution',
    'Narrate a small everyday disruption, reaction, and resolution using simple past narration and polite/apologetic language.'
  ),
  (
    'unit-normal-2',
    'normal',
    (select id from levels where mode = 'normal' and index = 2),
    2,
    'Something Ongoing, Something Changed',
    'Describe an ongoing situation, explain how it changed, and handle everyday setbacks with increasingly connected language.'
  ),
  (
    'unit-normal-3',
    'normal',
    (select id from levels where mode = 'normal' and index = 3),
    3,
    'Weighing What Matters',
    'Reflect on setbacks, relationships, commitments, and difficult decisions using increasingly complex language.'
  )
on conflict (id) do update set
  mode = excluded.mode,
  level_id = excluded.level_id,
  order_index = excluded.order_index,
  title = excluded.title,
  objective = excluded.objective,
  updated_at = now();

-- Lesson -> Unit/role assignments, matched by id (not order_index — see
-- the note in 20250117000000_content_redesign.sql: 'normal-8'/'normal-9'
-- ids don't line up with their own display order, so id is the only safe
-- key here).
update lessons set unit_id = 'unit-normal-1', role = 'establish' where id = 'normal-1';
update lessons set unit_id = 'unit-normal-1', role = 'build'     where id = 'normal-2';
update lessons set unit_id = 'unit-normal-1', role = 'build'     where id = 'normal-3';
update lessons set unit_id = 'unit-normal-1', role = 'integrate' where id = 'normal-4';
update lessons set unit_id = 'unit-normal-2', role = 'establish' where id = 'normal-5';
update lessons set unit_id = 'unit-normal-2', role = 'build'     where id = 'normal-6';
update lessons set unit_id = 'unit-normal-2', role = 'build'     where id = 'normal-7';
update lessons set unit_id = 'unit-normal-2', role = 'integrate' where id = 'normal-9';
update lessons set unit_id = 'unit-normal-3', role = 'establish' where id = 'normal-8';
update lessons set unit_id = 'unit-normal-3', role = 'build'     where id = 'normal-10';
update lessons set unit_id = 'unit-normal-3', role = 'build'     where id = 'normal-11';
update lessons set unit_id = 'unit-normal-3', role = 'integrate' where id = 'normal-12';

commit;

-- Verification queries (run manually after this migration commits):
--
-- select u.title, count(l.id) from units u left join lessons l on l.unit_id = u.id group by u.id, u.title, u.order_index order by u.order_index;
--   -> should return exactly 3 rows, each with count = 4.
--
-- select id, order_index, role from lessons where mode = 'normal' and status = 'published' order by order_index;
--   -> should return 12 rows, roles in the pattern establish, build, build, integrate, repeating every 4 rows by order_index.
