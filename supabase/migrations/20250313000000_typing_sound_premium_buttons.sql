-- The "Premium Buttons" keystroke sound collection (see
-- src/lib/typing-sound-button-packs.ts): ceramic, aluminum, softTouch,
-- magnetic, haptic, glassButton, pearl, toggle, microSwitch — nine refined
-- button-press sounds added alongside the existing 30 packs.
--
-- The sound_pack check constraint enumerates every valid value (see
-- 20250312000000_typing_sound_packs_expansion.sql, which did the same for the
-- previous 20), so it has to be dropped and re-created with the expanded list
-- or an admin saving one of the new packs would be rejected at the database
-- layer. The existing row's value is untouched, so the currently selected
-- pack keeps working unchanged.
alter table typing_sound_settings
  drop constraint if exists typing_sound_settings_sound_pack_check;

alter table typing_sound_settings
  add constraint typing_sound_settings_sound_pack_check check (
    sound_pack in (
      'ceramic', 'aluminum', 'softTouch', 'magnetic', 'haptic', 'glassButton', 'pearl', 'toggle', 'microSwitch',
      'soft', 'gentle', 'minimal', 'click', 'pop', 'bubble', 'typewriter', 'premium', 'mechanical', 'crystal',
      'glass', 'softTap', 'clean', 'modern', 'digital', 'tactile', 'calm', 'woodBlock', 'marimba', 'kalimba', 'pluck', 'waterDrop', 'thock', 'clicky', 'analog', 'handDrum', 'whisper', 'ticker', 'bamboo', 'feltPiano'
    )
  );
