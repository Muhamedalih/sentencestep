-- Per-book narration voice override — mirrors lessons.voice_id exactly
-- (20250120000000_voice_collections.sql): nullable, so a book with no
-- override keeps falling back to elevenlabs_settings.default_story_voice_id
-- unchanged. Lets an admin pick a specific narration voice for one book
-- (e.g. from the "Story audio status" dashboard's per-row voice picker)
-- instead of only ever using the one global default — see
-- book-voice-generation.ts's loadBookForVoiceWork, updated alongside this
-- migration to check it exactly like Stories already check lessons.voice_id.
-- ON DELETE SET NULL so a deleted voice can never leave a book pointing at a
-- nonexistent row.

alter table books
  add column voice_id text references voices (id) on delete set null;
