-- Admin-configurable default TTS voice (Milestone 15).
--
-- A single-row settings table rather than a per-lesson or per-user column:
-- the admin picks one default voice/rate/pitch/volume for the whole app,
-- and every learner's browser matches it against its own local voice list
-- at runtime (see src/hooks/use-speech.ts) — Web Speech API voices are
-- device/browser-specific, so this table stores a *preference*
-- (voice_name + voice_lang), never a guarantee that voice exists on any
-- given learner's machine.
--
-- Publicly readable (same reasoning as levels/lessons/sentences: reads
-- aren't sensitive, only writes are) so a learner's browser can fetch the
-- configured preference without needing to be signed in — free lessons
-- never require an account, and pronunciation shouldn't either.
create table if not exists tts_settings (
  id integer primary key default 1,
  voice_name text,
  voice_lang text,
  rate numeric not null default 0.95 check (rate between 0.5 and 2),
  pitch numeric not null default 1 check (pitch between 0 and 2),
  volume numeric not null default 1 check (volume between 0 and 1),
  updated_at timestamptz not null default now(),
  constraint tts_settings_singleton check (id = 1)
);

insert into tts_settings (id) values (1) on conflict (id) do nothing;

alter table tts_settings enable row level security;

create policy "TTS settings are publicly readable" on tts_settings
  for select using (true);

create policy "Admins manage TTS settings" on tts_settings
  for all using (is_admin()) with check (is_admin());
