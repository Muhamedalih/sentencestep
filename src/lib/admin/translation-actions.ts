"use server";

import { revalidatePath } from "next/cache";

import { requireEditorOrAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { findLessonIdsNeedingGeneration } from "@/lib/translation/candidates";
import { generateLessonTranslationDraft, keyFor } from "@/lib/translation/generate";
import { isSupportLocale } from "@/lib/i18n/locales";
import type { GenerationOutcome } from "@/lib/translation/generate";

export interface FieldActionResult {
  error?: string;
}

export interface GenerateTranslationsResult {
  error?: string;
  outcome?: GenerationOutcome;
}

export interface BulkGenerateResult {
  error?: string;
  lessonsProcessed?: number;
  generated?: number;
  skipped?: number;
  failed?: number;
}

/**
 * Every function below uses the service-role client for content reads and
 * writes, not the session-aware one — discovered necessary during live
 * verification, not assumed: `sentences`' RLS policy ("Free lesson
 * sentences are public; premium requires active access", see
 * 20250104000000_premium_access.sql) has no is_admin() bypass at all, only
 * is_free / an active subscription. Under the session-aware client, an
 * admin reviewing or generating translations for any non-free lesson would
 * silently see zero sentences — not an error, just an empty result — which
 * would have made generateLessonTranslationDraft think a 12-sentence story
 * had none, and the dashboard show a false "2/2 complete" (title +
 * description only). requireEditorOrAdmin() below is the real, non-bypassable
 * authorization boundary for every one of these functions — service-role
 * is reached only after it already passed, which is what makes this an
 * appropriate use of it rather than a substitute for authorization.
 */

/**
 * The manual, single-lesson, single-locale "Generate translation" admin
 * action (see lesson-translation-field.tsx).
 */
export async function generateLessonTranslations(
  lessonId: string,
  locale: string,
): Promise<GenerateTranslationsResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };

  if (!lessonId) return { error: "Missing lesson id." };
  if (!isSupportLocale(locale)) return { error: "Unsupported locale." };

  const supabase = createServiceRoleClient();
  const outcome = await generateLessonTranslationDraft(supabase, lessonId, locale);

  revalidatePath(`/admin/content/${lessonId}/edit`);
  revalidatePath("/admin/translations");
  return { outcome };
}

const MAX_BULK_LESSONS_PER_RUN = 25;

/**
 * The Phase 6 bulk-generation control (see /admin/translations) — one
 * admin-chosen locale, bounded to MAX_BULK_LESSONS_PER_RUN lessons per
 * click, reusing the same candidate-selection logic as the cron sweep
 * (findLessonIdsNeedingGeneration) so "which lessons need work" is decided
 * identically whether triggered by a human or a scheduler. Deliberately
 * not "translate the entire library" — an admin who wants more just clicks
 * again; each click only ever touches missing/failed-and-retriable work,
 * never a stale-but-approved translation (same protection as the sweep).
 */
export async function generateMissingTranslationsForLocale(
  locale: string,
): Promise<BulkGenerateResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };
  if (!isSupportLocale(locale)) return { error: "Unsupported locale." };

  const supabase = createServiceRoleClient();
  const lessonIds = await findLessonIdsNeedingGeneration(
    supabase,
    locale,
    MAX_BULK_LESSONS_PER_RUN,
  );

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const lessonId of lessonIds) {
    const outcome = await generateLessonTranslationDraft(supabase, lessonId, locale);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
  }

  revalidatePath("/admin/translations");
  return { lessonsProcessed: lessonIds.length, generated, skipped, failed };
}

async function fetchCurrentEnglishText(
  supabase: ReturnType<typeof createServiceRoleClient>,
  contentType: "lesson" | "sentence",
  contentId: string,
  field: "title" | "description" | "text",
): Promise<string | null> {
  if (contentType === "lesson") {
    const { data } = await supabase
      .from("lessons")
      .select("title, description")
      .eq("id", contentId)
      .maybeSingle();
    if (!data) return null;
    return field === "title" ? data.title : data.description;
  }
  const { data } = await supabase.from("sentences").select("en").eq("id", contentId).maybeSingle();
  return data?.en ?? null;
}

/**
 * Approve (editedValue omitted) or Edit & Approve (editedValue provided) —
 * the review dashboard's core human-in-the-loop action. Always: status
 * becomes 'approved', is_stale is cleared, source_snapshot is refreshed to
 * the current English text (an approval is itself a fresh confirmation
 * that this translation matches the current source), reviewed_at/
 * reviewed_by are stamped, and previous_value is cleared — a completed
 * approval has nothing left to compare against. Human approval always
 * wins here unconditionally (no compare-and-swap against a concurrent AI
 * write): a human explicitly approving in the dashboard is the one action
 * in this whole system that's allowed to simply win, by design — an AI
 * write racing against it uses its own compare-and-swap (see
 * writeGeneratedField) and would lose instead, since this write changes
 * status to 'approved' first.
 *
 * Uses the session-aware client only for auth.getUser() (reviewed_by needs
 * the real signed-in admin's id, which a service-role client has no
 * concept of) — every content read/write still goes through service-role,
 * for the same reason as every other function in this file.
 */
export async function approveTranslationField(
  lessonId: string,
  contentType: "lesson" | "sentence",
  contentId: string,
  field: "title" | "description" | "text",
  locale: string,
  editedValue?: string,
): Promise<FieldActionResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };
  if (!isSupportLocale(locale)) return { error: "Unsupported locale." };

  const admin = createServiceRoleClient();

  const englishText = await fetchCurrentEnglishText(admin, contentType, contentId, field);
  if (englishText === null)
    return { error: "Couldn't find the source content to approve against." };

  let value = editedValue?.trim();
  if (!value) {
    const { data: existing } = await admin
      .from("content_translations")
      .select("value")
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("field", field)
      .eq("locale", locale)
      .maybeSingle();
    value = typeof existing?.value === "string" ? existing.value : undefined;
  }
  if (!value) return { error: "Nothing to approve — no translated value exists yet." };

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const { error } = await admin.from("content_translations").upsert(
    {
      content_type: contentType,
      content_id: contentId,
      field,
      locale,
      value,
      status: "approved",
      is_stale: false,
      source_snapshot: englishText,
      previous_value: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "content_type,content_id,field,locale" },
  );
  if (error) return { error: "Couldn't save the approval. Please try again." };

  void logAdminAction("translation.approved", contentType, contentId, { field, locale, lessonId });
  revalidatePath("/admin/translations");
  revalidatePath(`/admin/translations/${lessonId}/${locale}`);
  return {};
}

/**
 * Explicit human-triggered regeneration of one specific field, including
 * one that's currently approved (the only case that needs this — an
 * already-eligible field is already covered by the ordinary generate/retry
 * action). Reuses generateLessonTranslationDraft's forceFields parameter
 * rather than a separate code path: the previously-approved value is
 * preserved into previous_value by writeGeneratedField, the new result
 * lands as a fresh 'ai_generated' draft, and it still requires a normal
 * approveTranslationField call afterward before it's trusted — regenerating
 * never approves anything itself.
 */
export async function regenerateTranslationField(
  lessonId: string,
  locale: string,
  contentType: "lesson" | "sentence",
  contentId: string,
  field: "title" | "description" | "text",
): Promise<GenerateTranslationsResult> {
  const forbidden = await requireEditorOrAdmin();
  if (forbidden) return { error: forbidden };
  if (!isSupportLocale(locale)) return { error: "Unsupported locale." };

  const supabase = createServiceRoleClient();
  const outcome = await generateLessonTranslationDraft(
    supabase,
    lessonId,
    locale,
    new Set([keyFor({ contentType, contentId, field })]),
  );

  void logAdminAction("translation.regenerated", contentType, contentId, {
    field,
    locale,
    lessonId,
  });
  revalidatePath("/admin/translations");
  revalidatePath(`/admin/translations/${lessonId}/${locale}`);
  return { outcome };
}
