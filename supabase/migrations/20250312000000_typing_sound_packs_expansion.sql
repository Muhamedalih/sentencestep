-- Twenty new keystroke sound packs (see src/lib/typing-sound-layered-packs.ts):
-- glass, softTap, clean, modern, digital, tactile, calm, woodBlock, marimba,
-- kalimba, pluck, waterDrop, thock, clicky, analog, handDrum, whisper, ticker,
-- bamboo, feltPiano — thirty packs in total alongside the original ten.
--
-- The sound_pack check constraint enumerates every valid value (see
-- 20250303000000_lesson_end_sound_and_keyboard_packs.sql, which did the same
-- for mechanical/crystal), so it has to be dropped and re-created with the
-- expanded list or an admin saving one of the new packs would be rejected at
-- the database layer. The existing row's value is untouched, so the
-- currently selected pack (the persisted selection) keeps working unchanged.
alter table typing_sound_settings
  drop constraint if exists typing_sound_settings_sound_pack_check;

alter table typing_sound_settings
  add constraint typing_sound_settings_sound_pack_check check (
    sound_pack in (
      'soft', 'gentle', 'minimal', 'click', 'pop', 'bubble', 'typewriter', 'premium',
      'mechanical', 'crystal',
      'glass', 'softTap', 'clean', 'modern', 'digital', 'tactile', 'calm', 'woodBlock',
      'marimba', 'kalimba', 'pluck', 'waterDrop', 'thock', 'clicky', 'analog', 'handDrum',
      'whisper', 'ticker', 'bamboo', 'feltPiano'
    )
  );
