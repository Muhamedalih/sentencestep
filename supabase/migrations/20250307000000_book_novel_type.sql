begin;

-- Adds a `type` column to `books`, letting a row represent either a regular
-- structured book (the existing default, unchanged) or a Novel — a curated,
-- copyright-safe summary of a famous novel that reuses the exact same Book
-- Learning Engine (book_sections/book_sentences, the reading UI, progress
-- tracking) a Book already has, rather than a parallel content type/table.
-- This is foundation-only: no novel rows are created here, and no
-- learner-facing surface reads `type` yet — see the app-layer queries in
-- src/lib/supabase/queries/library.ts, which filter every public read to
-- type = 'book' so a novel stays admin-only (in the admin panel only)
-- regardless of its `status`, until the learner-facing Books/Novels split
-- is built and approved.
alter table books add column type text not null default 'book' check (type in ('book', 'novel'));
create index books_type_idx on books (type);

commit;
