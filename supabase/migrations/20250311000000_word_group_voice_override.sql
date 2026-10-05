-- Per-group narration voice override for Word Lists — mirrors
-- books.voice_id exactly (20250218000000_book_voice_override.sql):
-- nullable, so a group with no override keeps falling back to
-- tts_settings.default_pronunciation_voice_id unchanged. Lets an admin
-- pick a specific Edge-TTS voice for one word group (from its edit page)
-- instead of every group only ever using the one global default — see
-- word-list-voice-generation.ts's generateWordGroupVoiceDraft, updated
-- alongside this migration to check it exactly like Stories/Normal
-- lessons already check their own voice_id, and to ignore it (falling
-- back to the default) if it doesn't resolve to an Edge-TTS voice — Word
-- Lists is permanently pinned to Edge-TTS (see content-provider-map.ts),
-- never auto-detected. ON DELETE SET NULL so a deleted voice can never
-- leave a group pointing at a nonexistent row.
alter table word_groups
  add column voice_id text references voices (id) on delete set null;
