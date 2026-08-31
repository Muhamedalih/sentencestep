-- Book Reading Experience Phase 2: Bookmarks + Notes. Purely additive, one
-- new table, no changes to books/book_sections/book_sentences/book_progress/
-- content_translations. A bookmark and a note are both private, per-reader
-- annotations on one sentence — the same (user, sentence) identity, so one
-- row covers both rather than two near-duplicate tables (Section 1/2 of the
-- spec this migration implements: "user + book + sentence/page identity
-- should be enough"). book_id is stored alongside sentence_id purely so a
-- future "list my bookmarks in this book" query never has to join through
-- book_sections to find it — book_sentences itself carries no book_id.
--
-- Deliberately NOT one row per book_progress-style moving pointer: unlike
-- reading position, a reader may want several sentences bookmarked/noted at
-- once, so this is a real per-sentence table, mirroring word_progress's
-- shape (one row per (user, word)) rather than book_progress's (one row per
-- (user, book)).
begin;

create table book_sentence_marks (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null references books (id) on delete cascade,
  sentence_id text not null references book_sentences (id) on delete cascade,
  is_bookmarked boolean not null default false,
  -- Null/empty means "no note" — never a required field just because a row
  -- exists (a row can exist for the bookmark alone, or the note alone).
  note text,
  updated_at timestamptz not null default now(),
  primary key (user_id, sentence_id)
);

-- Powers a future "your bookmarked/noted sentences in this book" view —
-- nothing reads this index yet in this phase, added alongside the table for
-- the same reason book_progress_user_last_read_idx was: free at table-
-- creation time, real churn to add later.
create index book_sentence_marks_user_book_idx on book_sentence_marks (user_id, book_id);

alter table book_sentence_marks enable row level security;

-- Same "owns their own row, nothing public" shape as book_progress — a
-- bookmark/note is private annotation data, never publicly readable and
-- never admin-managed content.
create policy "Users manage their own book marks" on book_sentence_marks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
