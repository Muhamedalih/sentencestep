-- Book Learning Engine: makes a Library book actually playable as a
-- SentenceStep learning experience. Purely additive against the exact
-- target shape sketched at the bottom of 20250127000000_library_foundation.sql
-- ("NOT created in this migration... documented here so that phase is a
-- purely additive migration against a known target shape, not a fresh
-- design exercise") — this migration follows that sketch, with two
-- deliberate deviations documented inline below.
--
--   book_sections     one row per section of a book (Section 1, Section 2,
--                      ...), ordered within the book.
--   book_sentences     one row per typing sentence within a section, ordered
--                       within the section. Same shape as `sentences`
--                       (id/order_index/en/audio_url) minus `ar`/
--                       `word_translations`/`speaker`: a book sentence's
--                       translation lives entirely in content_translations
--                       (content_type 'book_sentence') since, unlike the
--                       original lesson content, it never had a legacy
--                       Arabic-only column to begin with; word-by-word
--                       glosses and conversation speakers don't apply to
--                       book reading.
--   book_progress      ONE row per (user, book) — not one row per completed
--                       sentence (contrast word_progress). A book is read
--                       strictly in order (Section 11 of the spec this
--                       migration implements: "must NOT allow a learner to
--                       accidentally skip a sentence"), so "how far has this
--                       reader gotten" is fully captured by a single moving
--                       pointer (current_section_id/current_sentence_id) plus
--                       a count — see complete_book_sentence below for how
--                       that pointer both derives resume position AND gives
--                       duplicate-completion protection for free, with no
--                       separate per-sentence rows to keep consistent.
--                       completed_sentence_count is a real counter, not
--                       derived from stored rows — Section 14 of the spec is
--                       explicit that percent-complete must be computed
--                       (this count / a live count of book_sentences for
--                       that book), never stored directly, so there's nothing
--                       to desync: this counter is the ONLY thing this table
--                       stores, and the percentage itself is still computed
--                       at read time (see fetchBookProgress).
--
-- Deviations from the sketch: (1) an added created_at column on
-- book_progress, matching every other table in this schema — the sketch
-- simply omitted it. (2) book_sentences carries no word_translations column
-- — nothing in this phase authors or reads one, and the sketch's own mention
-- was speculative ("book_sentences ( ... word_translations jsonb ...")
-- rather than committed; adding an inert, never-populated, never-read column
-- is exactly the premature scaffolding this codebase avoids elsewhere. A
-- future phase that actually wants word-by-word glosses adds it additively,
-- same as everything else here.
begin;

create table book_sections (
  id text primary key,
  book_id text not null references books (id) on delete cascade,
  order_index integer not null,
  title text not null,
  -- Short optional summary of what this section covers — Section 19 of the
  -- spec's "before starting a section, the user should understand what
  -- they're about to read," kept to a single plain field rather than a
  -- richer authoring surface ("do not create a complicated section
  -- dashboard").
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index book_sections_book_idx on book_sections (book_id);
-- Enforces "sections with valid ordering" (Section 21 of the spec) at the
-- schema level — two sections of the same book can never silently share an
-- order_index.
create unique index book_sections_book_order_idx on book_sections (book_id, order_index);

create table book_sentences (
  id text primary key,
  section_id text not null references book_sections (id) on delete cascade,
  order_index integer not null,
  en text not null,
  -- Same optional pre-recorded-clip fallback as sentences.audio_url —
  -- PronunciationButton's existing priority order (a real audioUrl beats
  -- Kokoro) already understands this column for free the moment any admin
  -- workflow populates it; nothing does yet in this phase.
  audio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index book_sentences_section_idx on book_sentences (section_id);
create unique index book_sentences_section_order_idx on book_sentences (section_id, order_index);

-- One row per (user, book) — see this migration's header comment for why
-- this is a moving pointer, not a per-sentence log.
create table book_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null references books (id) on delete cascade,
  -- The NEXT section/sentence this reader should see on resume — null on
  -- both once the book is fully read (see complete_book_sentence). Set null
  -- (not cascaded to row deletion) if the referenced section/sentence is
  -- later removed by an admin, so a mid-edit book never orphans a learner's
  -- whole progress row over one deleted sentence.
  current_section_id text references book_sections (id) on delete set null,
  current_sentence_id text references book_sentences (id) on delete set null,
  completed_sentence_count integer not null default 0,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- Powers the Library's Continue Reading section (fetchContinueReadingBooks):
-- one learner's in-progress books, most-recently-read first.
create index book_progress_user_last_read_idx on book_progress (user_id, last_read_at desc);

alter table book_sections enable row level security;
alter table book_sentences enable row level security;
alter table book_progress enable row level security;

-- Same public-read / admin-write shape as every other content table.
create policy "Sections of published books are public; admins see all" on book_sections
  for select using (
    is_admin()
    or exists (select 1 from books where books.id = book_sections.book_id and books.status = 'published')
  );
create policy "Admins manage book sections" on book_sections
  for all using (is_admin()) with check (is_admin());

-- Mirrors sentences' own "published free is public, premium needs access"
-- policy exactly (see 20250108000000_admin_cms.sql) — books.is_free is
-- always true today and nothing enforces the premium branch yet (Section 22
-- of the spec this migration implements: "Do not implement this paywall
-- now"), but the gate already exists so a future `is_free = false` book
-- needs no RLS change to actually restrict its sentences, only a data change.
create policy "Sentences of published free books are public; premium needs access; admins see all" on book_sentences
  for select using (
    is_admin()
    or exists (
      select 1
      from book_sections sec
      join books b on b.id = sec.book_id
      where sec.id = book_sentences.section_id
        and b.status = 'published'
        and (
          b.is_free
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
  );
create policy "Admins manage book sentences" on book_sentences
  for all using (is_admin()) with check (is_admin());

-- A learner's own reading position is exactly as private as their lesson
-- progress (user_progress) or word progress (word_progress) — same shape.
create policy "Users manage their own book progress" on book_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Atomic "advance this reader past this sentence" — the single write path
-- for book progress, called once per completed sentence (see
-- recordBookSentenceCompletionAction). Mirrors record_mistake's reasoning
-- exactly (see 20250121000000_mistakes.sql): a client-side read-then-write
-- can't guarantee the +1 increment or the duplicate-completion guard are
-- atomic under a real race (double-click, a retried request after a dropped
-- response), a single UPDATE statement can. The guard here is a compare-
-- and-swap on current_sentence_id: the UPDATE below only ever matches a row
-- whose current_sentence_id still equals p_sentence_id at the moment
-- Postgres evaluates it (not at whenever this function started) — so a
-- second, duplicate call for the same sentence (the pointer has already
-- moved past it) always affects zero rows and is silently a no-op, never a
-- double count, double XP, or a skipped/duplicated position (Section 16 of
-- the spec this migration implements).
create or replace function public.complete_book_sentence(p_book_id text, p_sentence_id text)
returns table (
  out_completed_sentence_count integer,
  out_current_section_id text,
  out_current_sentence_id text,
  out_advanced boolean
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_this_section_id text;
  v_this_section_order integer;
  v_this_sentence_order integer;
  v_first_section_id text;
  v_first_sentence_id text;
  v_next_section_id text;
  v_next_sentence_id text;
  v_row_count integer;
begin
  if v_user_id is null then
    raise exception 'complete_book_sentence requires an authenticated user';
  end if;

  select bs.section_id, sec.order_index, bs.order_index
    into v_this_section_id, v_this_section_order, v_this_sentence_order
  from book_sentences bs
  join book_sections sec on sec.id = bs.section_id
  where bs.id = p_sentence_id and sec.book_id = p_book_id;

  if v_this_section_id is null then
    raise exception 'sentence % is not part of book %', p_sentence_id, p_book_id;
  end if;

  -- The book's very first sentence, in reading order — seeds a first-ever
  -- progress row for this (user, book) so the CAS update below has
  -- something to match against even on a never-started book.
  select bs.id, bs.section_id into v_first_sentence_id, v_first_section_id
  from book_sentences bs
  join book_sections sec on sec.id = bs.section_id
  where sec.book_id = p_book_id
  order by sec.order_index, bs.order_index
  limit 1;

  insert into book_progress (user_id, book_id, current_section_id, current_sentence_id, completed_sentence_count, last_read_at)
  values (v_user_id, p_book_id, v_first_section_id, v_first_sentence_id, 0, now())
  on conflict (user_id, book_id) do nothing;

  -- The sentence immediately after p_sentence_id in reading order — null
  -- when p_sentence_id is the book's last sentence, which is exactly what
  -- marks the book as fully read below.
  select bs.id, bs.section_id into v_next_sentence_id, v_next_section_id
  from book_sentences bs
  join book_sections sec on sec.id = bs.section_id
  where sec.book_id = p_book_id
    and (sec.order_index, bs.order_index) > (v_this_section_order, v_this_sentence_order)
  order by sec.order_index, bs.order_index
  limit 1;

  -- `returns table (...)` above implicitly declares a PL/pgSQL variable per
  -- output column. The first version of this function named those columns
  -- identically to book_progress's own columns (current_section_id,
  -- current_sentence_id, completed_sentence_count) and that collided badly:
  -- not just in expression contexts like WHERE (which qualifying with the
  -- table name fixes) but *also* in an UPDATE's SET target list — `set
  -- current_section_id = ...` is, perhaps surprisingly, still resolved
  -- through the same identifier lookup PL/pgSQL uses everywhere else, so a
  -- same-named OUT variable makes even the SET target ambiguous (Postgres
  -- error 42702), and qualifying a SET target isn't valid syntax to begin
  -- with. Renaming the OUT parameters (out_*, matching nothing in this
  -- table) removes every possible collision at the source instead of
  -- chasing individual ambiguous references one at a time.
  update book_progress
  set current_section_id = v_next_section_id,
      current_sentence_id = v_next_sentence_id,
      completed_sentence_count = book_progress.completed_sentence_count + 1,
      last_read_at = now()
  where user_id = v_user_id
    and book_id = p_book_id
    and current_sentence_id = p_sentence_id;

  get diagnostics v_row_count = row_count;

  return query
  select bp.completed_sentence_count, bp.current_section_id, bp.current_sentence_id, (v_row_count > 0)
  from book_progress bp
  where bp.user_id = v_user_id and bp.book_id = p_book_id;
end;
$$;

-- Widen content_translations to accept book section/sentence translations,
-- extending the same multilingual pipeline lesson/story/word-list content
-- already uses — see 20250127000000_library_foundation.sql for why this is
-- a constraint change, not a schema change, and why no rows are inserted
-- here (Section 5 of the spec this migration implements: "Do not create
-- translations for real book content in this phase").
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
  check (content_type in ('level', 'lesson', 'sentence', 'word_group', 'vocabulary_word', 'category', 'book', 'book_section', 'book_sentence'));

commit;
