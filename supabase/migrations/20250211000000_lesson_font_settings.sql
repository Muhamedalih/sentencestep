-- Admin-configurable per-section sentence font (Admin -> Fonts). Same
-- singleton-row shape as lesson_color_settings/typing_sound_settings — one
-- admin-picked set of overrides applies to every learner, read publicly
-- (see src/lib/admin/lesson-font-queries.ts, consumed by
-- src/app/learn/layout.tsx), written only by admins. A single jsonb column
-- holds only the sections (see src/lib/admin/learning-sections.ts) an admin
-- has actually assigned a font to (see src/lib/admin/lesson-font-settings.ts)
-- — any section missing from the object keeps that section's exact current
-- font (Stories' own font-serif utility included), which is what reproduces
-- today's design exactly for every learner until an admin explicitly
-- assigns one.
create table if not exists lesson_font_settings (
  id integer primary key default 1,
  fonts jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint lesson_font_settings_singleton check (id = 1)
);

insert into lesson_font_settings (id) values (1) on conflict (id) do nothing;

alter table lesson_font_settings enable row level security;

create policy "Lesson font settings are publicly readable" on lesson_font_settings
  for select using (true);

create policy "Admins manage lesson font settings" on lesson_font_settings
  for all using (is_admin()) with check (is_admin());
