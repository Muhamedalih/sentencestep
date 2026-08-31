-- Admin-configurable Lesson Completion visual theme (presentation only).
--
-- Same singleton-row shape as typing_sound_settings/tts_settings — one
-- admin-picked set of colors/typography/spacing/effects applies to every
-- learner's end-of-lesson screen, read publicly (see
-- src/lib/admin/lesson-completion-theme-queries.ts, consumed by
-- src/app/learn/layout.tsx), written only by admins. A single jsonb column
-- holds the theme (see src/lib/admin/lesson-completion-theme.ts for its
-- shape) rather than one column per field, since the theme has ~45 purely
-- visual fields and new ones may be added later without a migration; the
-- app always merges whatever is stored over the code-level defaults, so a
-- missing/unknown key is harmless.
create table if not exists lesson_completion_theme (
  id integer primary key default 1,
  theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint lesson_completion_theme_singleton check (id = 1)
);

insert into lesson_completion_theme (id) values (1) on conflict (id) do nothing;

alter table lesson_completion_theme enable row level security;

create policy "Lesson completion theme is publicly readable" on lesson_completion_theme
  for select using (true);

create policy "Admins manage lesson completion theme" on lesson_completion_theme
  for all using (is_admin()) with check (is_admin());
