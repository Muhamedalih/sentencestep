-- Admin-configurable per-role colors for the learner-facing lesson player
-- (Admin -> Color Settings). Same singleton-row shape as
-- lesson_completion_theme/typing_sound_settings/tts_settings — one
-- admin-picked set of hex colors applies to every learner, read publicly
-- (see src/lib/admin/lesson-color-settings-queries.ts, consumed by
-- src/app/learn/layout.tsx), written only by admins. A single jsonb column
-- holds only the roles an admin has actually overridden (see
-- src/lib/admin/lesson-color-settings.ts) — any key missing from the object
-- falls back to that role's CSS default in src/app/globals.css's
-- .lesson-shell block, which is what reproduces today's design exactly for
-- every learner until an admin explicitly changes a color.
create table if not exists lesson_color_settings (
  id integer primary key default 1,
  colors jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint lesson_color_settings_singleton check (id = 1)
);

insert into lesson_color_settings (id) values (1) on conflict (id) do nothing;

alter table lesson_color_settings enable row level security;

create policy "Lesson color settings are publicly readable" on lesson_color_settings
  for select using (true);

create policy "Admins manage lesson color settings" on lesson_color_settings
  for all using (is_admin()) with check (is_admin());
