-- A default voice for Normal lessons (Daily Lessons) only — split out of
-- tts_settings.default_pronunciation_voice_id, which from now on is Word
-- Lists' own setting exclusively (see 20250222000000_pronunciation_default_voice.sql).
--
-- Context: Normal lessons, Word Lists, and Mistake Review used to share one
-- column because all three were hardcoded to Edge-TTS. The voice system is
-- being rebuilt so each content type has its own fixed narration provider —
-- Stories/Conversation/Books stay on ElevenLabs, Normal lessons (Daily
-- Lessons) move to Hume AI, Word Lists move to Cartesia, Mistake Review
-- keeps its existing free Edge-TTS substitute logic (voice-audio.ts) and
-- needs no default of its own. Normal lessons and Word Lists therefore can
-- no longer share one default-voice column — a Hume voice id would never
-- resolve for Word Lists (which now requires a Cartesia voice), and vice
-- versa.
begin;

alter table tts_settings
  add column default_normal_lesson_voice_id text null;

commit;
