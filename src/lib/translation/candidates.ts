import type { SupabaseClient } from "@supabase/supabase-js";

import type { SupportLocale } from "@/lib/i18n/locales";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

const MAX_AUTO_RETRY_ATTEMPTS = 5;
const MAX_FAILED_CANDIDATES_SCANNED = 200;

function lessonIdFromContentId(contentType: string, contentId: string): string {
  return contentType === "lesson" ? contentId : contentId.replace(/-s\d+$/, "");
}

/**
 * Lesson ids worth attempting generation for, in one locale, bounded to
 * `limit` — prioritizes lessons with a retriable failed field (`attempts <
 * MAX_AUTO_RETRY_ATTEMPTS`), then fills any remaining budget with
 * published lessons ordered oldest-updated-first. Shared by the cron sweep
 * (src/app/api/cron/translation-sweep/route.ts, all enabled locales) and
 * the admin bulk-generate action (src/lib/admin/translation-actions.ts,
 * one admin-chosen locale) so the "which lessons need work" query logic
 * lives in exactly one place, not two drifting copies.
 *
 * Deliberately never surfaces stale-but-approved work — regenerating an
 * approved translation is an explicit human action from the review
 * dashboard (see markTranslationsStaleIfChanged's doc comment), never
 * something an automatic or bulk sweep does on its own. Calling
 * generateLessonTranslationDraft on the ids this returns is still safe
 * either way (it independently re-checks eligibility and skips approved
 * fields itself), but this function doesn't even offer them up as
 * candidates in the first place.
 */
export async function findLessonIdsNeedingGeneration(
  supabase: DbClient,
  locale: SupportLocale,
  limit: number,
): Promise<string[]> {
  const { data: failedRows, error: failedError } = await supabase
    .from("content_translations")
    .select("content_type, content_id")
    .eq("locale", locale)
    .eq("status", "failed")
    .lt("attempts", MAX_AUTO_RETRY_ATTEMPTS)
    .limit(MAX_FAILED_CANDIDATES_SCANNED);
  if (failedError) throw failedError;

  const ids = new Set<string>();
  for (const row of failedRows ?? []) {
    ids.add(lessonIdFromContentId(row.content_type, row.content_id));
    if (ids.size >= limit) return [...ids].slice(0, limit);
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id")
    .eq("status", "published")
    .order("updated_at", { ascending: true })
    .limit(limit * 2);
  if (lessonsError) throw lessonsError;

  for (const lesson of lessons ?? []) {
    if (ids.size >= limit) break;
    ids.add(lesson.id);
  }

  return [...ids].slice(0, limit);
}
