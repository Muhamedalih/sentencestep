-- Passages: short real-life scenes (funny, serious, inspiring) a learner
-- listens to and reads part by part. A passage is a list of PARTS
-- (passage_sections); each part is a handful of LINES (passage_sentences,
-- each optionally spoken by a named character, each with its Arabic
-- translation and its narrated clip) followed by one quick comprehension
-- question. At the end the passage's own key words are handed over as a
-- Word Lists group (passages.word_group_id).
--
-- Purely additive: four new tables and one function; nothing existing is
-- altered. The section stays invisible until it is published from the app
-- (Admin -> Features -> Passages, or the Publish button on the Passages page).
--
--   passages           one row per passage (title, level, tone, card icon,
--                      the Word Lists group made from its words).
--   passage_sections   one row per part, ordered within the passage. The part's
--                      question(s) live here as jsonb — a question is never
--                      read or written on its own, only with its part, so a
--                      table of its own would be a join with nothing to gain.
--   passage_sentences  one row per line, ordered within the part. `speaker` is
--                      null for the narrator; `ar` is the Arabic translation
--                      (the only support language authored so far); `audio_url`
--                      is the narrated clip, filled in by
--                      scripts/generate-passage-audio.ts.
--   passage_progress   ONE row per (user, passage): how many parts are done,
--                      the best score, and when it was first finished — a
--                      moving pointer, like book_progress, not a log.
--
-- Who can read what. The three content tables are readable only by admins
-- through RLS; learners get a passage through the app's own server code (the
-- service-role client), which first checks the "passages" switch in
-- feature_settings (Off / Admin preview / On). So publishing is one switch,
-- and the tables can never be read straight from the browser by someone the
-- switch has not reached. passage_progress is each learner's own.
begin;

create table passages (
  id text primary key,
  -- Position in the list, unique within a level (see the index below).
  order_index integer not null,
  level text not null default 'A1' check (level in ('A1', 'A2', 'B1', 'B2')),
  tone text not null check (tone in ('funny', 'serious', 'inspiring')),
  -- A key into the app's fixed icon set (src/lib/passages/icons.ts), never free text.
  icon text not null default 'book',
  title text not null,
  title_ar text not null,
  summary text not null,
  summary_ar text not null,
  -- A passage can be held back on its own even while the section is open.
  status text not null default 'published' check (status in ('draft', 'published')),
  is_free boolean not null default true,
  -- The Word Lists group made from this passage's words. SET NULL, not
  -- cascade: deleting a group in Word Lists must never delete a passage.
  word_group_id text references word_groups (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index passages_level_order_idx on passages (level, order_index);

create table passage_sections (
  id text primary key,
  passage_id text not null references passages (id) on delete cascade,
  order_index integer not null,
  title text not null,
  title_ar text not null,
  -- [{ id, prompt, prompt_ar, options: [{ en, ar }], answer, evidence }] —
  -- `answer` indexes `options`; `evidence` is the 0-based position, within this
  -- part, of the line that holds the answer (lit up after a wrong answer).
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index passage_sections_passage_order_idx on passage_sections (passage_id, order_index);

create table passage_sentences (
  id text primary key,
  section_id text not null references passage_sections (id) on delete cascade,
  order_index integer not null,
  speaker text,
  en text not null,
  ar text not null,
  audio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index passage_sentences_section_order_idx on passage_sentences (section_id, order_index);

create table passage_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  passage_id text not null references passages (id) on delete cascade,
  sections_done integer not null default 0 check (sections_done >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  total_questions integer not null default 0 check (total_questions >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, passage_id)
);

create index passage_progress_user_idx on passage_progress (user_id, updated_at desc);

alter table passages enable row level security;
alter table passage_sections enable row level security;
alter table passage_sentences enable row level security;
alter table passage_progress enable row level security;

create policy "Admins manage passages" on passages
  for all using ((select is_admin())) with check ((select is_admin()));
create policy "Admins manage passage sections" on passage_sections
  for all using ((select is_admin())) with check ((select is_admin()));
create policy "Admins manage passage sentences" on passage_sentences
  for all using ((select is_admin())) with check ((select is_admin()));

create policy "Users manage their own passage progress" on passage_progress
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Saves how far a learner got, in one round trip and monotonic: parts done and
-- the score only ever go up, and the first completion time is kept, so a
-- replay of a finished passage (or a delayed duplicate request) can never move
-- progress backwards. security invoker: RLS still applies, and auth.uid() is
-- the caller — there is no way to write someone else's row.
create or replace function public.record_passage_progress(
  p_passage_id text,
  p_sections_done integer,
  p_correct integer,
  p_total integer,
  p_completed boolean
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to save progress.';
  end if;

  insert into passage_progress (
    user_id, passage_id, sections_done, correct_answers, total_questions, completed_at
  )
  values (
    auth.uid(),
    p_passage_id,
    greatest(p_sections_done, 0),
    greatest(p_correct, 0),
    greatest(p_total, 0),
    case when p_completed then now() end
  )
  on conflict (user_id, passage_id) do update set
    sections_done = greatest(passage_progress.sections_done, excluded.sections_done),
    correct_answers = greatest(passage_progress.correct_answers, excluded.correct_answers),
    total_questions = greatest(passage_progress.total_questions, excluded.total_questions),
    completed_at = coalesce(passage_progress.completed_at, excluded.completed_at),
    updated_at = now();
end;
$$;

commit;
