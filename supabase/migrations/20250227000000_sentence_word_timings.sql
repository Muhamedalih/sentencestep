-- Sentence word timing (forced alignment) — the data that lets a word click
-- play a SLICE of a sentence's own already-generated narration clip instead
-- of a separate, freshly-synthesized isolated-word clip (see
-- src/lib/voice/word-timing.ts). Never touches voice_audio_cache or the
-- sentence audio files themselves: this table only ever records WHERE
-- (start/end seconds) a word already sits inside an existing clip, computed
-- read-only by feeding that clip's own audio bytes + known transcript to an
-- external forced-alignment service. A sentence with no row here simply
-- keeps using the pre-existing isolated-word-clip path (see
-- resolvePronunciationAudioAction) — this is purely additive.
--
-- Deliberately its own table, not a column on `sentences`/`book_sentences`:
-- timing is keyed on (content, voice) the same way voice_audio_cache is —
-- the exact same sentence text under a different voice has different audio
-- and therefore different word timing, and content_type/content_id together
-- span both `sentences` and `book_sentences` without a nullable FK to each.
create table sentence_word_timings (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('sentence', 'book_sentence')),
  content_id text not null,
  voice_id text not null references voices (id) on delete cascade,
  -- [{word, start, end}, ...], start/end in seconds into that voice's own
  -- resolved sentence clip — see WordTiming in word-timing.ts for the exact
  -- shape written here.
  words jsonb not null,
  -- 'ready': words is usable. 'skipped': the alignment service's own word
  -- count didn't match this content's real tokenization (e.g. "200,000"
  -- transcribed for a written-out "Two hundred thousand" — a real case
  -- confirmed live during prototyping) — recorded so a retry never re-spends
  -- the alignment call on content that's already known to fail cleanly.
  status text not null default 'ready' check (status in ('ready', 'skipped')),
  created_at timestamptz not null default now(),
  unique (content_type, content_id, voice_id)
);

create index sentence_word_timings_lookup_idx
  on sentence_word_timings (content_type, content_id, voice_id);

alter table sentence_word_timings enable row level security;

-- Same public-read / service-role-write shape as voice_audio_cache: rows are
-- only ever written by a server-side script using the service-role client
-- (bypassing RLS), never by a learner's own session — no INSERT/UPDATE
-- policy is needed for that path.
create policy "Sentence word timings are publicly readable" on sentence_word_timings
  for select using (true);
