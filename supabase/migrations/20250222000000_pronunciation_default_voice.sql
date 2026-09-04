-- A default voice for Normal lessons, Word Lists, and Mistake Review —
-- deliberately a separate column from tts_settings.default_voice_id, which
-- Stories/Conversation/Books already use as their own admin-configured
-- default (see elevenlabs_settings.default_story_voice_id and
-- story-voice-generation.ts's resolveTargetVoices). The two must never be
-- the same column: an admin picking a pronunciation voice for Normal
-- lessons must never be able to accidentally change what Stories/Books
-- sound like, and vice versa.
begin;

alter table tts_settings
  add column default_pronunciation_voice_id text null;

commit;
