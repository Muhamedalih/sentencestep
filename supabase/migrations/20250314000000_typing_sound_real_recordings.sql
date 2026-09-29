-- The "Real Recordings" keystroke sound collection (see
-- src/lib/typing-sound-sample-packs.ts and public/sounds/typing): classicOffice,
-- tactileSwitch, softOffice, deepThock and studioClick — five packs built from
-- real recordings of real hardware, added alongside the existing 39 packs.
--
-- The sound_pack check constraint enumerates every valid value (see
-- 20250313000000_typing_sound_premium_buttons.sql, which did the same for the
-- previous batch), so it has to be dropped and re-created with the expanded
-- list or an admin saving one of the new packs would be rejected at the
-- database layer. The existing row's value is untouched, so the currently
-- selected pack keeps working unchanged. This list supersedes the earlier
-- ones: running only this migration is enough.
alter table typing_sound_settings
  drop constraint if exists typing_sound_settings_sound_pack_check;

alter table typing_sound_settings
  add constraint typing_sound_settings_sound_pack_check check (
    sound_pack in (
      'classicOffice', 'tactileSwitch', 'softOffice', 'deepThock', 'studioClick',
      'ceramic', 'aluminum', 'softTouch', 'magnetic', 'haptic', 'glassButton', 'pearl', 'toggle', 'microSwitch',
      'soft', 'gentle', 'minimal', 'click', 'pop', 'bubble', 'typewriter', 'premium', 'mechanical', 'crystal',
      'glass', 'softTap', 'clean', 'modern', 'digital', 'tactile', 'calm', 'woodBlock', 'marimba', 'kalimba', 'pluck', 'waterDrop', 'thock', 'clicky', 'analog', 'handDrum', 'whisper', 'ticker', 'bamboo', 'feltPiano'
    )
  );
