-- Removes Kokoro (self-hosted ONNX TTS) entirely. Kokoro's native
-- dependencies (onnxruntime-node + @huggingface/transformers, ~340MB
-- combined) made the server bundle too large/too many functions to deploy
-- on serverless hosts (Vercel's function-count limit, then Netlify's
-- function-size limit — same root cause, two different symptoms). Normal
-- lessons now go through the same background narration pipeline as
-- Stories/Conversation (see src/lib/voice/story-voice-generation.ts) —
-- Edge-TTS by default, or whichever provider is configured.
--
-- Storage cleanup (each kokoro voice's sample_audio_url and every cached
-- clip in voice_audio_cache pointing at it) is not done here — this
-- migration only touches Postgres rows, not Storage objects, and
-- voice_audio_cache rows for a deleted voice cascade-delete at the database
-- level (see that table's own FK). Any orphaned Storage objects this leaves
-- behind are harmless and can be cleaned up manually if desired.
begin;

delete from voices where source = 'kokoro';

drop table if exists kokoro_generation_attempts;

commit;
