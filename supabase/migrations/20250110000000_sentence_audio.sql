-- Milestone 13: pronunciation audio references for sentences.
--
-- Nullable by design — recorded audio is added incrementally per sentence,
-- never required up front. NULL means "no dedicated audio file yet"; the
-- learner UI falls back to the browser's built-in speech synthesis in that
-- case (see src/components/learning/pronunciation-button.tsx), so nothing
-- here blocks the lesson from working. No RLS changes needed: this is a
-- column on the existing sentences table, already covered row-by-row by
-- the Milestone 11 policies ("Published free sentences are public; premium
-- needs access; admins see all" / "Admins manage sentences").
alter table sentences
  add column if not exists audio_url text;
