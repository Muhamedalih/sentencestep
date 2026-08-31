-- Two additions to typing_sound_settings (20250115000000_typing_sound_settings.sql,
-- 20250135000000_sentence_complete_sound.sql):
--
-- 1. Five new sentence-completion sounds alongside the original six (see
--    src/lib/sentence-complete-sounds.ts) — pageTurn/whoosh are filtered-noise
--    "textural" sounds, success/pop/keyClick are new oscillator sounds. The
--    existing sentence_complete_sound check constraint enumerates every valid
--    value, so it has to be dropped and re-created with the expanded list or
--    every new name would be rejected at the database layer.
--
-- 2. A jsonb column letting an admin assign a *different* sentence-completion
--    sound per learner-facing section (see src/lib/admin/learning-sections.ts
--    and resolveSectionSentenceCompleteSound in typing-sound-settings.ts) —
--    same "only overridden keys are stored, a missing key falls back to the
--    plain global default" shape as lesson_color_settings.colors. Seeded with
--    three defaults (page-turn for Book Reading, a softer whoosh for Stories,
--    a snappy pop for Word Lists) instead of empty, since those three were
--    explicitly requested; every other section still inherits the plain
--    sentence_complete_sound column until an admin opts it into something else.
alter table typing_sound_settings
  drop constraint if exists typing_sound_settings_sentence_complete_sound_check;

alter table typing_sound_settings
  add constraint typing_sound_settings_sentence_complete_sound_check check (
    sentence_complete_sound in (
      'chime', 'bell', 'sparkle', 'ding', 'harp', 'twinkle',
      'pageTurn', 'whoosh', 'success', 'pop', 'keyClick'
    )
  );

alter table typing_sound_settings
  add column if not exists section_sentence_complete_sounds jsonb not null default
    '{"books": "pageTurn", "stories": "whoosh", "wordLists": "pop"}'::jsonb;
