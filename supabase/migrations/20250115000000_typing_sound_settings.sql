-- Admin-configurable global typing sound (Premium enhancement milestone).
--
-- Same singleton-row shape as tts_settings (20250114000000_tts_settings.sql):
-- one admin-picked pack/volume/enabled toggle applies to every learner's
-- typing session, read publicly (see src/lib/admin/typing-sound-queries.ts,
-- consumed by src/app/learn/layout.tsx), written only by admins.
create table if not exists typing_sound_settings (
  id integer primary key default 1,
  enabled boolean not null default true,
  sound_pack text not null default 'soft' check (
    sound_pack in ('soft', 'gentle', 'minimal', 'click', 'pop', 'bubble', 'typewriter', 'premium')
  ),
  volume numeric not null default 0.6 check (volume between 0 and 1),
  updated_at timestamptz not null default now(),
  constraint typing_sound_settings_singleton check (id = 1)
);

insert into typing_sound_settings (id) values (1) on conflict (id) do nothing;

alter table typing_sound_settings enable row level security;

create policy "Typing sound settings are publicly readable" on typing_sound_settings
  for select using (true);

create policy "Admins manage typing sound settings" on typing_sound_settings
  for all using (is_admin()) with check (is_admin());
