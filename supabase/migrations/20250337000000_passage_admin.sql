-- Passages: the admin's own settings for the narration.
--
--   passage_speaker_voices  one ElevenLabs voice per character of a passage (and
--                           'narrator' for the voice that reads the story), chosen in
--                           Admin -> Passages. Mirrors lesson_speaker_voices.
--   passage_sentences.say   what the voice says when it must differ from the displayed
--                           line (a spelled-out number) — null: the line as written.
--   passage_sentences.pause where the voice takes a breath in the line (see
--                           src/lib/passages/narration-pauses.ts) — null: by the rules.
--
-- Additive and idempotent: nothing that exists is changed.

begin;

create table if not exists passage_speaker_voices (
  passage_id text not null references passages (id) on delete cascade,
  speaker text not null,
  voice_id text not null references voices (id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (passage_id, speaker)
);

alter table passage_speaker_voices enable row level security;

drop policy if exists "Admins manage passage speaker voices" on passage_speaker_voices;
create policy "Admins manage passage speaker voices" on passage_speaker_voices
  for all using ((select is_admin())) with check ((select is_admin()));

alter table passage_sentences add column if not exists say text;
alter table passage_sentences add column if not exists pause jsonb;

commit;
