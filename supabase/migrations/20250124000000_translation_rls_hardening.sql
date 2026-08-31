-- Tightens content_translations' public-read RLS policy from "any row" to
-- "any approved row, or an admin" — closing a real gap the app-level
-- filter in src/lib/i18n/content-translations.ts's getContentTranslations
-- (added alongside this migration) only protects the normal learner-facing
-- code path through: RLS itself still allowed any unauthenticated request,
-- including a direct call to the Supabase REST API bypassing that
-- function entirely, to read ai_generated/failed rows. This makes "an
-- AI-generated draft is never learner-visible" a database-enforced
-- guarantee, not just an application-level convention that a future code
-- path could forget to apply.
--
-- Safe for every existing caller: the admin dashboard and every admin
-- action (src/lib/admin/translation-*.ts, src/lib/admin/translations.ts)
-- always use the session-aware client authenticated as an admin, so
-- is_admin() is true for them and this policy is unchanged from their
-- point of view. generateLessonTranslationDraft's background callers
-- (auto-trigger, the cron sweep) use the service-role client, which
-- bypasses RLS entirely regardless of this policy. Only genuinely public,
-- unauthenticated reads are newly restricted — exactly the intended
-- narrowing.

drop policy if exists "Content translations are publicly readable" on content_translations;

create policy "Approved content translations are publicly readable" on content_translations
  for select using (status = 'approved' or is_admin());
