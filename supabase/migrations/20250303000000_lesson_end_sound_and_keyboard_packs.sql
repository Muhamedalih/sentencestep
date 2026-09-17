-- Two additions to typing_sound_settings (20250115000000_typing_sound_settings.sql):
--
-- 1. Two new keystroke sound packs (see src/lib/typing-sound-packs.ts):
--    "mechanical" (a heavier, punchier clack) and "crystal" (the richest,
--    most polished pack). The existing sound_pack check constraint
--    enumerates every valid value, so it has to be dropped and re-created
--    with the expanded list or these new names would be rejected at the
--    database layer.
--
-- 2. A brand-new, independent "lesson end" sound (see
--    src/lib/lesson-end-sounds.ts) that plays once when a whole lesson
--    finishes, not per-sentence like sentence_complete_sound above — its own
--    enabled toggle plus a check-constrained sound name, same shape as
--    sentence_complete_sound's own column pair.
alter table typing_sound_settings
  drop constraint if exists typing_sound_settings_sound_pack_check;

alter table typing_sound_settings
  add constraint typing_sound_settings_sound_pack_check check (
    sound_pack in (
      'soft', 'gentle', 'minimal', 'click', 'pop', 'bubble', 'typewriter', 'premium',
      'mechanical', 'crystal'
    )
  );

alter table typing_sound_settings
  add column if not exists lesson_end_sound_enabled boolean not null default true;

alter table typing_sound_settings
  add column if not exists lesson_end_sound text not null default 'fanfare' check (
    lesson_end_sound in ('fanfare', 'victory', 'crowd', 'starBurst', 'grandChime')
  );
