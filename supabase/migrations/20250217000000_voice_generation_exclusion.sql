-- Per-item "exclude from automatic narration generation" flag for Stories
-- and Books — the admin Voice > "Story audio status" dashboard needs a way
-- to opt a specific lesson/book out of the bulk "Generate Missing Audio"
-- sweep and the background cron sweep, without having to unpublish it (see
-- src/lib/voice/candidates.ts's findLessonIdsNeedingVoiceGeneration/
-- findBookIdsNeedingVoiceGeneration, both updated alongside this migration
-- to filter on this column).

alter table lessons
  add column if not exists voice_generation_excluded boolean not null default false;

alter table books
  add column if not exists voice_generation_excluded boolean not null default false;
