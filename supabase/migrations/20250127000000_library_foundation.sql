-- Library foundation: a new, third top-level content section (alongside the
-- three learning modes and the separate Word Lists system) for summarized
-- books. This migration is architecture-only — no real book, section, or
-- sentence content is inserted. See the "Future book structure" note at the
-- bottom for the Sections/Sentences/progress tables deliberately NOT created
-- here.
--
-- Three new tables, fully additive — no existing table, enum, or column is
-- touched:
--
--   categories        a real, admin-managed taxonomy (Self Development,
--                      Business, ...), not hardcoded UI strings.
--   books              foundation-only book metadata. Deliberately NOT
--                      layered onto lessons/sentences, same reasoning as
--                      word_groups/vocabulary_words in
--                      20250119000000_word_lists.sql: a book (title, author,
--                      cover, category-grouped) is a genuinely different
--                      shape from a typing lesson, and its own future
--                      Sections/Sentences will be a third, sibling shape
--                      again — not a fourth `learning_mode`.
--   book_categories    many-to-many between books and categories, with one
--                      row per pair optionally flagged `is_primary` (at most
--                      one primary category per book, enforced by a partial
--                      unique index) — the "main shelf" a book appears under
--                      versus the secondary categories it's also filterable
--                      by.
--
-- difficulty_level reuses the same 1/2/3 Beginner/Intermediate/Advanced tier
-- semantics as levels.index and word_groups.level (see src/lib/levels.ts's
-- difficultyForLevel) rather than introducing a CEFR scale or a duplicate
-- label system — a book's difficulty is informational metadata, not a
-- sequencing key the way a lesson's level is, so it lives directly on
-- `books` rather than joining through the `levels` table.
--
-- is_free / free_preview_sentence_count exist now so a future book's premium
-- transition (is_free: true -> false, free_preview_sentence_count: 10) is a
-- data change, never a schema change. Nothing reads free_preview_sentence_count
-- yet — there ARE no sentences to preview until the future Sections/Sentences
-- tables exist — but the column is here so that phase is additive.
begin;

create table categories (
  id text primary key,
  name text not null,
  description text,
  order_index integer not null default 0,
  -- Soft delete, matching the status-lifecycle convention used by every
  -- other content table (lessons/word_groups status draft/published/
  -- archived) rather than a hard DELETE — see the doc comment on
  -- delete_category's replacement below (deleteCategory in
  -- src/lib/admin/library-actions.ts) for why this is the safe behavior the
  -- admin "delete" action actually performs: is_active goes false, existing
  -- book_categories rows are left completely intact, so a category that's
  -- in use can never be silently broken out from under its books.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_order_idx on categories (order_index);

create table books (
  id text primary key,
  title text not null,
  author text not null,
  description text,
  cover_image_url text,
  -- Same 1/2/3 tier scale as levels.index / word_groups.level — see this
  -- migration's header comment.
  difficulty_level integer not null default 1 check (difficulty_level between 1 and 3),
  is_featured boolean not null default false,
  -- All books are free while this is default true; setting it false plus a
  -- non-zero free_preview_sentence_count is what a future phase's paywall
  -- reads — see this migration's header comment. No RLS policy or app code
  -- restricts anything based on this pair yet (Section 9/25 of the spec this
  -- migration implements: premium restrictions are explicitly NOT activated
  -- in this phase).
  is_free boolean not null default true,
  free_preview_sentence_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index books_status_idx on books (status);
create index books_featured_idx on books (is_featured) where is_featured;

create table book_categories (
  book_id text not null references books (id) on delete cascade,
  category_id text not null references categories (id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (book_id, category_id)
);

create index book_categories_category_idx on book_categories (category_id);

-- At most one primary category per book — a partial unique index rather
-- than a check constraint, since "at most one true per book_id" can't be
-- expressed as a per-row check.
create unique index book_categories_one_primary_per_book
  on book_categories (book_id) where is_primary;

alter table categories enable row level security;
alter table books enable row level security;
alter table book_categories enable row level security;

-- Same public-read / admin-write shape as every other content table
-- (is_admin() defined in 20250108000000_admin_cms.sql). Inactive categories
-- and non-published books stay visible to admins (for management) but drop
-- out of every learner-facing read.
create policy "Active categories are public; admins see all" on categories
  for select using (is_active or is_admin());
create policy "Admins manage categories" on categories
  for all using (is_admin()) with check (is_admin());

create policy "Published books are public; admins see all" on books
  for select using (status = 'published' or is_admin());
create policy "Admins manage books" on books
  for all using (is_admin()) with check (is_admin());

-- Book-category links carry no independent sensitivity beyond the rows they
-- join — publicly readable (a locked/unpublished book's links are harmless
-- metadata, and the book row itself is already gated above); only admins
-- change which categories a book belongs to.
create policy "Book category links are publicly readable" on book_categories
  for select using (true);
create policy "Admins manage book category links" on book_categories
  for all using (is_admin()) with check (is_admin());

-- Widen content_translations to accept the two new content types, preparing
-- the same multilingual pipeline used for lesson/story/word-list content —
-- see supabase/migrations/20250122000000_locale_foundation.sql's header
-- comment for why this table is keyed by (content_type, content_id, field,
-- locale) rather than needing a schema change per content type. No rows are
-- inserted here: book/category translations are a later phase (Section 18
-- of the spec this migration implements — "Do not generate book
-- translations now").
-- Looked up dynamically rather than assumed by name — it was never given an
-- explicit name in the original migration (Postgres auto-names it) and
-- guessing wrong would fail the migration; same technique
-- 20250123000000_translation_lifecycle_foundation.sql already used for this
-- table's `locale` constraint.
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'content_translations'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%content_type%word_group%';

  if constraint_name is not null then
    execute format('alter table content_translations drop constraint %I', constraint_name);
  end if;
end $$;

alter table content_translations add constraint content_translations_content_type_check
  check (content_type in ('level', 'lesson', 'sentence', 'word_group', 'vocabulary_word', 'category', 'book'));

-- Seed the initial category taxonomy. Plain inserts, not
-- `on conflict do nothing` — this migration only ever runs once per
-- environment, and a real id collision here would mean something is
-- actually wrong, not a safe no-op to swallow.
insert into categories (id, name, order_index) values
  ('category-self-development', 'Self Development', 0),
  ('category-business', 'Business', 1),
  ('category-psychology', 'Psychology', 2),
  ('category-money-finance', 'Money & Finance', 3),
  ('category-productivity', 'Productivity', 4),
  ('category-biography', 'Biography', 5),
  ('category-philosophy', 'Philosophy', 6);

commit;

-- ---------------------------------------------------------------------
-- NOT created in this migration — deliberately deferred to the phase that
-- adds real book content, per this migration's header comment. Documented
-- here so that phase is a purely additive migration against a known target
-- shape, not a fresh design exercise:
--
--   book_sections (
--     id text primary key,
--     book_id text not null references books (id) on delete cascade,
--     order_index integer not null,
--     title text not null,
--     ...
--   )
--
--   book_sentences (
--     id text primary key,
--     section_id text not null references book_sections (id) on delete cascade,
--     order_index integer not null,
--     en text not null,
--     word_translations jsonb,
--     ...
--   )
--
--   book_progress (
--     user_id uuid not null references auth.users (id) on delete cascade,
--     book_id text not null references books (id) on delete cascade,
--     current_section_id text references book_sections (id) on delete set null,
--     current_sentence_id text references book_sentences (id) on delete set null,
--     completed_sentence_count integer not null default 0,
--     last_read_at timestamptz not null default now(),
--     primary key (user_id, book_id)
--   )
--
-- book_progress deliberately has NO stored completion-percentage column —
-- Section 13 of the spec this migration implements is explicit that percent
-- complete must always be computed (completed_sentence_count / a count of
-- book_sentences for that book), never stored/incremented directly, so
-- there is nothing to desync. Modeled as its own table rather than reusing
-- user_progress for the same reason word_progress is its own table (see
-- 20250119000000_word_lists.sql's header comment): user_progress.lesson_id
-- is a foreign key into `lessons`, which a book is not, and book
-- completion is intentionally not wired into the lesson-based XP/streak
-- loop by default.
