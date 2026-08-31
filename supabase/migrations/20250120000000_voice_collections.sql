-- Kokoro Natural Learning voice collection + per-lesson voice override.
--
-- The existing tts_settings/voice-settings-form.tsx system is a browser
-- Web Speech API *preference* — a voice name matched against whatever's
-- installed on each learner's own device, never a real, storable audio
-- asset (see voice-settings.ts's doc comment). This is a genuinely
-- different, additive concept: a `voices` row is a real, curated,
-- server-generated voice with its own stored preview clip and a stable id
-- lessons can reference — the Web Speech preference system is left
-- completely untouched and still applies whenever no `voices` row is
-- resolved for a piece of content (see voice-resolution.ts).
create table voices (
  id text primary key,
  name text not null,
  -- 'kokoro' today; kept as its own column (not folded into id) so a future
  -- second provider doesn't force renaming every existing row.
  source text not null default 'kokoro',
  -- The raw upstream voice code (e.g. "af_heart") passed to the provider's
  -- generate() call — kept distinct from `id` so this app's own ids never
  -- have to match the upstream naming scheme.
  provider_voice_id text not null,
  gender text not null check (gender in ('female', 'male')),
  accent text not null,
  language text not null default 'en',
  description text,
  collection text not null,
  sample_audio_url text,
  created_at timestamptz not null default now()
);

create index voices_collection_idx on voices (collection);

-- Deliberately its own table, not a column tacked onto `sentences` (which
-- has its own admin-uploaded audio_url, always higher priority — see
-- voice-resolution.ts): one sentence's text can need a cached clip per
-- *voice*, not per sentence, and the same normalized text can recur across
-- different sentences/vocabulary words. Keyed by (voice, exact normalized
-- text, generation settings) rather than a content id for exactly that
-- reason — see hashNormalizedText in voice-audio.ts, the single place this
-- key is computed. Deleting a voice cascades here: its cached clips are
-- meaningless without it (the storage files themselves are cleaned up in
-- application code before the row is deleted — see deleteVoiceAction).
create table voice_audio_cache (
  id uuid primary key default gen_random_uuid(),
  voice_id text not null references voices (id) on delete cascade,
  text_hash text not null,
  normalized_text text not null,
  -- Provider + model + quantization + any generation parameter that would
  -- change the resulting audio for the same (voice, text) pair — bumping
  -- this invalidates old cached clips without deleting them outright (a
  -- stale row simply stops being looked up once nothing queries its old
  -- version string).
  generation_version text not null,
  audio_url text not null,
  created_at timestamptz not null default now(),
  unique (voice_id, text_hash, generation_version)
);

-- The global default Kokoro voice — additive alongside the existing
-- voice_name/voice_lang Web Speech preference, which stays the fallback
-- whenever this is null (an unconfigured project, or before an admin ever
-- picks one, behaves exactly as it does today).
alter table tts_settings
  add column default_voice_id text references voices (id) on delete set null;

-- Per-lesson override. Nullable: existing lessons keep working unchanged,
-- resolving to the global default (see voice-resolution.ts's
-- `lesson.voiceId ?? globalDefaultVoiceId`). `on delete set null` is the
-- safety net underneath deleteVoiceAction's own explicit "is this voice
-- assigned to any lesson" check — even if that check were ever bypassed, a
-- deleted voice can never leave a lesson pointing at a nonexistent row.
alter table lessons
  add column voice_id text references voices (id) on delete set null;

alter table voices enable row level security;
alter table voice_audio_cache enable row level security;

-- Same public-read / admin-write shape as every other content table
-- (levels/lessons/sentences/tts_settings): a voice's metadata and its
-- cached clips aren't sensitive, only writes are.
create policy "Voices are publicly readable" on voices
  for select using (true);
create policy "Admins manage voices" on voices
  for all using (is_admin()) with check (is_admin());

-- No public INSERT/UPDATE policy on voice_audio_cache: rows are only ever
-- written by the on-demand generation Server Action, which uses the
-- service-role client (bypassing RLS) — the same pattern already used by
-- src/lib/analytics/track.ts to record a system-level event on behalf of a
-- learner with no admin session of their own. Reads are public because any
-- learner's browser needs to resolve a cache hit during ordinary playback.
create policy "Voice audio cache is publicly readable" on voice_audio_cache
  for select using (true);

-- Same public-bucket shape as lesson-illustrations: learners load clips by
-- URL with no auth round-trip, writes are the part that's gated. Voice
-- preview samples and generated lesson/vocabulary clips both live here,
-- under a "voices/<voiceId>/" and "generated/<voiceId>/" prefix
-- respectively (see uploadVoiceSample/uploadGeneratedClip in
-- voice-storage.ts) — one bucket, not two, since both are the same kind of
-- asset with the same access rules.
insert into storage.buckets (id, name, public)
values ('voice-audio', 'voice-audio', true)
on conflict (id) do nothing;

-- Admin-only writes for preview samples (uploaded via the seed action);
-- the on-demand generation path instead uses the service-role client (see
-- voice_audio_cache's own INSERT reasoning above), which bypasses these
-- policies entirely rather than needing a public INSERT policy that would
-- let an arbitrary session write into this bucket.
create policy "Admins upload voice audio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voice-audio' and is_admin());

create policy "Admins delete voice audio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'voice-audio' and is_admin());
