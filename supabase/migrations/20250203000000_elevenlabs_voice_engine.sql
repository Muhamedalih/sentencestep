-- ElevenLabs voice engine: expressive, pre-generated audio for Stories and
-- Conversation lessons, sitting alongside the existing Kokoro on-demand
-- pipeline (20250120000000_voice_collections.sql) rather than replacing it.
-- Normal lessons keep using Kokoro exactly as before — nothing here changes
-- that path.
--
-- Three things, in order:
--
-- 1. Lifecycle + provider-metadata columns on the existing voice_audio_cache
--    table (extended, not duplicated — see src/lib/voice/resolution.ts's
--    cacheKeyParts, unchanged by this migration: a row's identity is still
--    exactly (voice_id, text_hash, generation_version), which is what lets
--    an admin-facing "pending/generating/ready/failed" status live on this
--    same table instead of a second parallel one).
--
--    audio_url becomes nullable because a 'generating'/'failed' row now
--    legitimately exists before any audio does — the background generation
--    pipeline (src/lib/voice/story-voice-generation.ts) claims a row by
--    inserting it in 'generating' state, then fills in audio_url on
--    success. Every pre-existing row is a completed Kokoro clip, backfilled
--    accordingly.
--
--    There is deliberately no 'pending' status value stored anywhere: a
--    sentence with no cache row at all *is* "pending" by construction (the
--    admin dashboard computes this from absence, exactly the way
--    content_translations already treats "no row" as "not yet generated" —
--    see 20250123000000_translation_lifecycle_foundation.sql). Storing an
--    explicit 'pending' row would mean writing to this table on every
--    lesson save just to paint a UI label, for no behavioral benefit.
--
-- 2. lesson_speaker_voices: persistent per-character voice assignment for
--    Conversation lessons. sentences.speaker (init_schema.sql) is free text
--    with no voice mapping today — every speaker in a conversation plays
--    back in the same single resolved voice (see typing-sentence.tsx before
--    this change). This table is the missing link: one ElevenLabs voice per
--    (lesson, speaker) pair, chosen by the admin once and reused on every
--    regeneration, exactly like a Story's single voice_id already is.
--
-- 3. elevenlabs_settings: a singleton table for the admin-configurable
--    ElevenLabs defaults (model, default story voice, voice_settings).
--    Deliberately separate from tts_settings — that table's
--    default_voice_id is specifically the global Kokoro default consumed by
--    resolveVoiceId() for every lesson type; folding a second provider's
--    defaults into the same row would make "the default voice" ambiguous
--    depending on which system asked.

-- ---------------------------------------------------------------------
-- 1. voice_audio_cache lifecycle + provider metadata
-- ---------------------------------------------------------------------

alter table voice_audio_cache
  alter column audio_url drop not null,
  add column if not exists status text not null default 'ready'
    check (status in ('generating', 'ready', 'failed')),
  add column if not exists provider text not null default 'kokoro',
  add column if not exists model text,
  -- The Voice Director's raw per-sentence direction for this row (emotion/
  -- energy/pace/emphasis/pause) — admin transparency and debugging only,
  -- never read by the playback path. Null for every Kokoro row.
  add column if not exists voice_direction jsonb,
  add column if not exists duration_ms integer,
  add column if not exists attempts integer not null default 0,
  add column if not exists last_error text,
  add column if not exists updated_at timestamptz not null default now();

-- No backfill UPDATE needed: every row that existed before this migration
-- is a successfully generated Kokoro clip (the only provider until now),
-- and status/provider's own column defaults above ('ready'/'kokoro') are
-- applied by Postgres to every existing row as part of adding a NOT NULL
-- column with a default — exactly the outcome an explicit UPDATE would
-- otherwise produce.

create index if not exists voice_audio_cache_status_idx
  on voice_audio_cache (status) where status <> 'ready';

-- ---------------------------------------------------------------------
-- 2. Conversation speaker -> voice assignment
-- ---------------------------------------------------------------------

create table if not exists lesson_speaker_voices (
  lesson_id text not null references lessons (id) on delete cascade,
  speaker text not null,
  voice_id text not null references voices (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (lesson_id, speaker)
);

alter table lesson_speaker_voices enable row level security;

-- Same public-read / admin-write shape as every other content table.
create policy "Speaker voices are publicly readable" on lesson_speaker_voices
  for select using (true);
create policy "Admins manage speaker voices" on lesson_speaker_voices
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- 3. ElevenLabs global settings (singleton)
-- ---------------------------------------------------------------------

create table if not exists elevenlabs_settings (
  id smallint primary key default 1 check (id = 1),
  model text not null default 'eleven_v3',
  default_story_voice_id text references voices (id) on delete set null,
  stability numeric not null default 0.5 check (stability between 0 and 1),
  similarity_boost numeric not null default 0.75 check (similarity_boost between 0 and 1),
  style numeric not null default 0.3 check (style between 0 and 1),
  speed numeric not null default 1.0 check (speed between 0.7 and 1.2),
  use_speaker_boost boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into elevenlabs_settings (id) values (1) on conflict (id) do nothing;

alter table elevenlabs_settings enable row level security;

create policy "ElevenLabs settings are publicly readable" on elevenlabs_settings
  for select using (true);
create policy "Admins manage elevenlabs settings" on elevenlabs_settings
  for all using (is_admin()) with check (is_admin());
