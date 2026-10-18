import { getContentTranslations, resolveScalarField } from "@/lib/i18n/content-translations";
import type { SupportLocale } from "@/lib/i18n/locales";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * A short look at something that is part of Premium: the first few sentences of a
 * lesson or story, or the first few words of a word list. A locked lesson's sentences
 * (and a locked list's words) are hidden from a free learner by the database itself
 * (see supabase/migrations/20250104000000_premium_access.sql), so this reads them with
 * the service role — and only ever the first PREVIEW_LINE_COUNT of one lesson or group
 * the caller has already confirmed is published, with the columns shown and nothing
 * else. The number is capped here, in the query, not by whoever calls it.
 */

/** How many lines of a Premium lesson, story, passage or word list a visitor is shown. The one place that number lives. */
export const PREVIEW_LINE_COUNT = 3;

export interface PreviewLine {
  id: string;
  /** English: a sentence, a passage line or a word. */
  en: string;
  /** In the learner's own language, when there is one. */
  support?: string;
}

export interface LockedPreview {
  lines: PreviewLine[];
  /** How many there are in all. */
  total: number;
}

/** The first sentences of a published lesson or story. Null when there are none or the read failed: the caller then shows the ordinary lock instead. */
export async function fetchLessonPreview(
  lessonId: string,
  locale?: SupportLocale,
): Promise<LockedPreview | null> {
  try {
    const { data, count, error } = await createServiceRoleClient()
      .from("sentences")
      .select("id, en, ar, order_index", { count: "exact" })
      .eq("lesson_id", lessonId)
      .order("order_index")
      .limit(PREVIEW_LINE_COUNT);
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) return null;

    const translations = locale
      ? await getContentTranslations(
          "sentence",
          rows.map((row) => row.id),
          locale,
        )
      : undefined;
    return {
      total: count ?? rows.length,
      lines: rows.map((row) => {
        const support =
          locale && translations
            ? resolveScalarField(translations, row.id, "text", row.ar, locale)
            : undefined;
        return { id: row.id, en: row.en, ...(support !== undefined ? { support } : {}) };
      }),
    };
  } catch (error) {
    console.error("[locked preview] fetchLessonPreview failed", error);
    return null;
  }
}

/** The first words of a published word list, each with its hint in the learner's language. Null when there are none or the read failed. */
export async function fetchWordGroupPreview(
  groupId: string,
  locale?: SupportLocale,
): Promise<LockedPreview | null> {
  try {
    const { data, count, error } = await createServiceRoleClient()
      .from("vocabulary_words")
      .select("id, target_word, hint_ar, order_index", { count: "exact" })
      .eq("group_id", groupId)
      .order("order_index")
      .limit(PREVIEW_LINE_COUNT);
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) return null;

    const translations = locale
      ? await getContentTranslations(
          "vocabulary_word",
          rows.map((row) => row.id),
          locale,
        )
      : undefined;
    return {
      total: count ?? rows.length,
      lines: rows.map((row) => {
        const support =
          locale && translations
            ? resolveScalarField(translations, row.id, "hint", row.hint_ar, locale)
            : undefined;
        return { id: row.id, en: row.target_word, ...(support !== undefined ? { support } : {}) };
      }),
    };
  } catch (error) {
    console.error("[locked preview] fetchWordGroupPreview failed", error);
    return null;
  }
}
