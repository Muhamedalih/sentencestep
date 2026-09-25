-- Community, Step 1 (competitor report Section 6.3): a simple 1-5 star
-- rating per (user, book) — the lowest-risk piece of the "community" gap
-- against apps like Abjad. Deliberately no review text yet (a bigger
-- surface, left for later) and no live "N people reading now" (that needs
-- either real-time presence or a caching layer this project doesn't have
-- yet). Applies to Books and Novels for free: both share this same `books`
-- table and are told apart only by its `type` column.
--
-- The average/count is NEVER cached on the books row (no trigger, no
-- denormalized column, no elevated-privilege function) — book_rating_summaries
-- below computes it on demand, one grouped aggregate query per already-
-- existing page load (Library home, Book Overview), the same "one batched
-- query, not N+1" shape fetchCategoryLinksForBooks/resolveBookDescriptions
-- already use elsewhere in this schema (see
-- src/lib/supabase/queries/library.ts). A cached column would need a
-- SECURITY DEFINER trigger so a regular reader's insert could update the
-- shared `books` row — a privilege-escalation pattern this schema has never
-- needed before — while a live aggregate query over a small, indexed table
-- costs Supabase essentially nothing at this site's traffic.
begin;

create table book_ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null references books (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- Powers book_rating_summaries' `where book_id = any(...)` below.
create index book_ratings_book_idx on book_ratings (book_id);

alter table book_ratings enable row level security;

-- A learner manages only their own rating — same shape as
-- book_progress/book_sentence_marks.
create policy "Users manage their own book rating" on book_ratings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Unlike book_progress/book_sentence_marks (private annotations), a rating
-- is meant to be aggregated across every reader — this second, broader
-- policy OR's in with the one above so SELECT is public while
-- insert/update/delete stay owner-only.
create policy "Book ratings are public to read" on book_ratings
  for select using (true);

-- One grouped aggregate per call (see this migration's header comment) —
-- plain read-only SQL, security invoker: the public SELECT policy above
-- already lets any caller read every row, so no elevated privilege is
-- needed here.
create or replace function public.book_rating_summaries(p_book_ids text[])
returns table (book_id text, average numeric, rating_count integer)
language sql
security invoker
stable
set search_path = public
as $$
  select br.book_id, avg(br.rating), count(*)::integer
  from book_ratings br
  where br.book_id = any(p_book_ids)
  group by br.book_id;
$$;

commit;
