-- "Fix Your Mistakes": one active record per (user, word) — a word-level
-- retention queue, additive and fully separate from user_progress/streaks/
-- XP. Deliberately its own table, not layered onto sentences or
-- vocabulary_words: a mistake's identity is the WORD itself (normalized
-- text — see src/lib/mistakes/normalize.ts), not any single sentence it was
-- typed in, since the same word recurs across many lessons and must
-- collapse to one outstanding item regardless. sentence_id is kept purely
-- as "the most recent real sentence this word was misspelled in" — display
-- context and pronunciation content, never part of the row's identity.
begin;

create table mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Normalized identity (lowercase, punctuation-stripped — see
  -- normalizeMistakeWord). Sentences have no stable per-word id in the
  -- existing schema, so the word's own normalized text is the strongest
  -- identifier available; this is what the unique constraint below is keyed
  -- on, which is what makes "same word, many lessons, one record" hold.
  word text not null,
  sentence_id text not null references sentences (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'corrected')),
  -- Optional analytics signal (how many times this word has been gotten
  -- wrong, across every time it entered the queue) — never read by the
  -- queue/ordering logic itself.
  mistake_count integer not null default 1,
  corrected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word)
);

create index mistakes_user_id_idx on mistakes (user_id);
-- Every real read filters on both columns together (the active queue for
-- one user) — see fetchMistakes/fetchActiveMistakeCount.
create index mistakes_user_id_status_idx on mistakes (user_id, status);

alter table mistakes enable row level security;

create policy "Users manage their own mistakes" on mistakes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Atomic "record a mistake on this word" — a single INSERT ... ON CONFLICT
-- DO UPDATE, so a race between two concurrent requests for the same
-- (user, word) can never produce two rows or lose an increment (which a
-- client-side read-then-upsert couldn't guarantee). security invoker
-- (the default, stated explicitly) and auth.uid() read from inside the
-- function rather than trusting a caller-supplied user id — the caller can
-- only ever record a mistake against their own account, exactly like every
-- RLS-scoped write elsewhere in this schema. Re-entering an already-
-- 'corrected' word flips it back to 'active' and clears corrected_at,
-- which is the whole mechanism behind "a future mistake re-enters the
-- queue" (see the final report).
create or replace function public.record_mistake(p_word text, p_sentence_id text)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into mistakes (user_id, word, sentence_id, status, mistake_count, corrected_at)
  values (auth.uid(), p_word, p_sentence_id, 'active', 1, null)
  on conflict (user_id, word) do update set
    sentence_id = excluded.sentence_id,
    status = 'active',
    mistake_count = mistakes.mistake_count + 1,
    corrected_at = null,
    updated_at = now();
$$;

commit;
