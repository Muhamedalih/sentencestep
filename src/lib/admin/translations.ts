import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { SupportLocale } from "@/lib/i18n/locales";

type ContentType = Database["public"]["Tables"]["content_translations"]["Row"]["content_type"];

/**
 * Admin-side reads/writes against content_translations, for any support
 * locale — used for Arabic, Spanish, and Turkish alike (see saveLesson in
 * content-actions.ts, which calls upsertTranslation once per locale per
 * field). Arabic ALSO still gets written to the legacy `_ar` columns
 * (title_ar, description_ar, sentences.ar) by saveLesson directly — this
 * module doesn't touch those, and they aren't being dropped in this phase;
 * this is what keeps content_translations synchronized with them going
 * forward, closing the staleness gap fixed in
 * 20250123000000_translation_lifecycle_foundation.sql (that migration
 * fixed the data as it stood at the time; this is what stops it drifting
 * again on the next edit). Uses the session-aware client (same as every
 * other admin mutation in content-actions.ts), relying on the "Admins
 * manage content translations" RLS policy from the locale-foundation
 * migration as the real authorization boundary — never the service-role
 * client.
 */

/**
 * Batch-reads existing translations, in one locale, for a set of content
 * ids, keyed `${contentId}:${field}` — mirrors getContentTranslations in
 * src/lib/i18n/content-translations.ts, but admin-scoped (every status, not
 * just 'approved') and explicit about which locale rather than always
 * 'es'. Used for both Spanish (levels, lesson list/detail) and Turkish
 * (lesson detail) — see content-queries.ts — so a lesson already carrying an
 * approved Turkish translation (from a future manual edit or backfill) round
 * -trips back into the edit form instead of being silently dropped the next
 * time an admin saves that lesson (saveLesson's upsertTranslation calls
 * would otherwise see an empty titleTr/description Tr and delete the
 * existing row).
 */
export async function getTranslations(
  locale: SupportLocale,
  contentType: ContentType,
  contentIds: string[],
): Promise<Map<string, unknown>> {
  const map = new Map<string, unknown>();
  if (contentIds.length === 0) return map;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_translations")
    .select("content_id, field, value")
    .eq("content_type", contentType)
    .eq("locale", locale)
    .in("content_id", contentIds);

  if (error) {
    // Same defensive PGRST205 handling as the learner-facing reader — the
    // migration hasn't been applied to this project yet.
    if (error.code === "PGRST205") return map;
    throw error;
  }

  for (const row of data ?? []) map.set(`${row.content_id}:${row.field}`, row.value);
  return map;
}

/**
 * Writes (or clears) one translation field, in one locale. An
 * empty/whitespace-only value deletes the row rather than storing an empty
 * value — storing "" would make resolveScalarField treat this field as
 * "translated" (typeof "" === "string") and show a blank string to learners
 * instead of correctly falling back to English, so "no translation yet"
 * must mean "no row", not "an empty row". (Arabic never actually hits this
 * branch today — validateLessonInput requires every Arabic field — but the
 * function stays locale-generic rather than assuming that.)
 *
 * Always writes as a direct human edit: status is set to "approved" (never
 * "ai_generated" — nothing here is AI-written), is_stale is reset to false,
 * and source_snapshot is refreshed to the English text passed in, so a
 * future staleness check has an accurate baseline. previous_value is
 * cleared: it exists to let an admin compare against the last-approved text
 * when reviewing a future AI-regenerated draft (see the lifecycle-columns
 * migration's doc comment), and a fresh manual edit supersedes whatever
 * that bookkeeping held.
 */
export async function upsertTranslation(
  locale: SupportLocale,
  contentType: ContentType,
  contentId: string,
  field: string,
  value: string | undefined,
  sourceText: string | null | undefined,
): Promise<void> {
  const supabase = await createClient();
  const trimmed = value?.trim();

  if (!trimmed) {
    const { error } = await supabase
      .from("content_translations")
      .delete()
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("field", field)
      .eq("locale", locale);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("content_translations").upsert(
    {
      content_type: contentType,
      content_id: contentId,
      field,
      locale,
      value: trimmed,
      status: "approved",
      is_stale: false,
      source_snapshot: sourceText?.trim() || null,
      previous_value: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "content_type,content_id,field,locale" },
  );
  if (error) throw error;
}

/**
 * Same as upsertEsTranslation, for the `{en, text}[]` word-array fields
 * (preview_sentences today; word_translations has no admin editor yet). An
 * empty array deletes the row, matching upsertEsTranslation's "no row" rule.
 */
export async function upsertEsWordArrayTranslation(
  contentType: ContentType,
  contentId: string,
  field: string,
  pairs: { en: string; es: string }[],
): Promise<void> {
  const supabase = await createClient();
  const nonEmpty = pairs.filter((pair) => pair.es.trim().length > 0);

  if (nonEmpty.length === 0) {
    const { error } = await supabase
      .from("content_translations")
      .delete()
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("field", field)
      .eq("locale", "es");
    if (error) throw error;
    return;
  }

  const value = pairs.map((pair) => ({ en: pair.en, text: pair.es }));
  const { error } = await supabase.from("content_translations").upsert(
    {
      content_type: contentType,
      content_id: contentId,
      field,
      locale: "es",
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "content_type,content_id,field,locale" },
  );
  if (error) throw error;
}

/**
 * Which sentence ids from a lesson's previous sentence set no longer exist
 * after a save. saveLesson() (content-actions.ts) deletes and reinserts
 * every one of a lesson's sentences on every save, using deterministic ids
 * (`${lessonId}-s${index + 1}`) — ids are stable across an edit as long as
 * the sentence count doesn't change, but if it shrinks (e.g. after a mode
 * change, since validateLessonInput requires an exact count per mode),
 * the higher-indexed ids stop existing. content_translations has no
 * foreign key to sentences — it can't: content_id also points at lessons,
 * levels, word_groups, etc., so a single-table FK isn't possible — so nothing
 * cascades this automatically, and a naive save would leave orphaned
 * translation rows (any locale) behind forever. Pure and locale-agnostic on
 * purpose: the caller decides how to delete, this just decides what's
 * orphaned, and it doesn't care how many locales exist.
 */
export function orphanedSentenceTranslationIds(
  previousSentenceIds: string[],
  newSentenceIds: string[],
): string[] {
  const stillValid = new Set(newSentenceIds);
  return previousSentenceIds.filter((id) => !stillValid.has(id));
}

/**
 * Whether an existing translation is now stale relative to the current
 * English source text — true only when a snapshot exists and no longer
 * matches. A null snapshot (a legacy/pre-lifecycle row, or one whose source
 * was itself null when generated) is deliberately never marked stale here:
 * there's nothing to compare against, so "unknown" is treated as "not
 * proven stale," not guessed at.
 */
export function isNowStale(sourceSnapshot: string | null, currentSourceText: string): boolean {
  return sourceSnapshot !== null && sourceSnapshot !== currentSourceText;
}

/**
 * Flags every locale's translation for this exact (content_type,
 * content_id, field) stale if its source_snapshot no longer matches the
 * current English text — called from saveLesson() AFTER the Arabic/Spanish
 * upserts above (sequentially, not concurrently: by the time this runs,
 * those two locales' own source_snapshot has already been refreshed to the
 * new English text by upsertTranslation, so this pass's own comparison
 * naturally leaves them alone without needing to special-case them — no
 * race is possible since it only ever runs once their write has already
 * committed). Only ever flips is_stale on a row that already exists; it
 * never creates rows, deletes them, or touches value/status — an approved
 * translation stays exactly as approved, just now also flagged for review,
 * exactly matching the "preserve the previous approved value" rule.
 */
export async function markTranslationsStaleIfChanged(
  contentType: ContentType,
  contentId: string,
  field: string,
  currentSourceText: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_translations")
    .update({ is_stale: true })
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .eq("field", field)
    .eq("is_stale", false)
    .not("source_snapshot", "is", null)
    .neq("source_snapshot", currentSourceText);
  if (error) throw error;
}
