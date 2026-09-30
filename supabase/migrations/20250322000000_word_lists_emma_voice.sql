-- Word Lists speak in one voice: Edge-TTS "Emma" (en-US-EmmaNeural).
--
-- Word Lists' voice is data, not code: generateWordGroupVoiceDraft
-- (word-list-voice-generation.ts) reads tts_settings.default_pronunciation_voice_id
-- and lets word_groups.voice_id (20250311000000_word_group_voice_override.sql)
-- override it per group with *any* Edge-TTS voice. Nothing guaranteed either
-- one was Emma, and nothing guaranteed Emma's `voices` row even existed
-- (it's only created by the admin's one-click "seed Edge-TTS voices" action).
-- This makes all three true, idempotently — safe to re-run.
--
-- The learner-facing Word Lists pages only ever look audio up under the
-- site-wide default (getDefaultPronunciationVoiceId), never a group's own
-- override, so a group left on a different voice generated clips the
-- learner could never find and fell back to the browser's robotic speech
-- synthesis. Clearing those overrides makes generation and playback agree.
--
-- Mirrors WORD_LIST_VOICE_ID in src/lib/voice/content-provider-map.ts and
-- Emma's entry in src/lib/voice/edge-tts-catalog.ts — keep the three in sync.
begin;

-- 1. Emma's voice row must exist and must actually be an Edge-TTS voice
--    (word-list-voice-generation.ts rejects a default whose `source` isn't
--    the Word Lists provider). Only the fields that decide correctness are
--    overwritten on conflict, so an admin's edited description or stored
--    preview clip (sample_audio_url) on an existing row is left alone.
insert into voices (id, name, source, provider_voice_id, gender, accent, language, description, collection)
values (
  'edge-tts-en-us-emma',
  'Emma',
  'edge-tts',
  'en-US-EmmaNeural',
  'female',
  'American',
  'en',
  'Bright, energetic American voice.',
  'edge-tts'
)
on conflict (id) do update
  set source = excluded.source,
      provider_voice_id = excluded.provider_voice_id,
      gender = excluded.gender;

-- 2. Emma is the site-wide Word Lists default.
update tts_settings
   set default_pronunciation_voice_id = 'edge-tts-en-us-emma',
       updated_at = now()
 where id = 1;

-- 3. No word group keeps a per-group override pointing at any other voice —
--    it falls back to the default above, exactly like a group that never had
--    one. (An override that is already Emma is harmless and left alone.)
update word_groups
   set voice_id = null
 where voice_id is not null
   and voice_id <> 'edge-tts-en-us-emma';

commit;
