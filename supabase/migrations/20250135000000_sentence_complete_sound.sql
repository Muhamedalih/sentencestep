-- Adds the admin-selectable sentence-completion sound to the existing
-- typing_sound_settings singleton row (20250115000000_typing_sound_settings.sql)
-- rather than a parallel table: it's the same global-default settings
-- architecture, just one more admin-picked field every learner's typing
-- session reads (see src/lib/admin/typing-sound-queries.ts, consumed by
-- src/app/learn/layout.tsx). Independent of sound_pack: sound_pack governs
-- the letter/error keystroke tones, this governs the distinct chime played
-- once a whole sentence is typed correctly (see
-- src/lib/sentence-complete-sounds.ts for the six selectable sounds).
alter table typing_sound_settings
  add column if not exists sentence_complete_sound text not null default 'chime' check (
    sentence_complete_sound in ('chime', 'bell', 'sparkle', 'ding', 'harp', 'twinkle')
  );
