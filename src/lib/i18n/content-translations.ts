import { createPublicClient } from "@/lib/supabase/public-client";
import type { Database } from "@/types/database";
import type { SupportLocale } from "@/lib/i18n/locales";

type ContentType = Database["public"]["Tables"]["content_translations"]["Row"]["content_type"];

export interface WordTranslation {
  en: string;
  text: string;
}

/**
 * All of one locale's translation rows for a batch of content ids, keyed
 * `${contentType}:${contentId}:${field}` — one round trip per (contentType,
 * locale) pair regardless of how many ids/fields are being resolved, same
 * batching shape as fetchLessons' existing sentences-by-lesson-ids query in
 * src/lib/supabase/queries/content.ts.
 *
 * `status = 'approved'` is a hard filter, not an optimization — this is the
 * only place learner-facing code reads content_translations, so it's the
 * one enforcement point for the rule that an AI-generated draft never
 * becomes visible to a learner just by existing in the table. A row that's
 * `ai_generated` or `failed` is treated exactly like a missing row: absent
 * from the returned map, so resolveScalarField/resolveWordArrayField fall
 * back to the legacy column (Arabic) or English (everything else) below,
 * same as before this column existed. Admin-side reads that need every
 * status (the translation review dashboard, src/lib/admin/translation-
 * queries.ts) intentionally do NOT go through this function.
 */
export async function getContentTranslations(
  contentType: ContentType,
  contentIds: string[],
  locale: SupportLocale,
): Promise<Map<string, unknown>> {
  const map = new Map<string, unknown>();
  if (contentIds.length === 0) return map;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("content_translations")
    .select("content_id, field, value")
    .eq("content_type", contentType)
    .eq("locale", locale)
    .eq("status", "approved")
    .in("content_id", contentIds);

  if (error) {
    // PGRST205 = "relation not found" — the locale-foundation migration
    // hasn't been applied to this project yet. Same defensive shape as
    // getStartSimplePreviews' handling of a not-yet-applied
    // levels.preview_sentences column in src/lib/content.ts: a real,
    // expected state right after this code ships and before someone runs
    // the migration, not a bug — every caller already falls back to the
    // legacy `_ar` column (for Arabic) or English (for Spanish, with a dev
    // warning) when this map comes back empty, so degrading to "no
    // translations found" here is correct, not silent data loss. Any other
    // error is a real failure and still thrown.
    if (error.code === "PGRST205") {
      console.error(
        `[i18n] content_translations table not found — has supabase/migrations/20250122000000_locale_foundation.sql been applied yet? Falling back to legacy columns.`,
      );
      return map;
    }
    throw error;
  }

  for (const row of data ?? []) {
    map.set(`${row.content_id}:${row.field}`, row.value);
  }
  return map;
}

/**
 * Resolves a single scalar field (title/description/text/hint) for one
 * content item: the new content_translations table first, then the legacy
 * `_ar` column when the current locale is Arabic (so Arabic never regresses
 * while content_translations is still being populated — see the locale
 * foundation migration's backfill), then undefined. Callers decide the
 * final fallback (typically the English text, with a dev-only warning —
 * see resolveSupportTextOrWarn below) since "undefined" alone would either
 * crash a render or silently show blank support text, neither of which
 * this app should ever do.
 */
export function resolveScalarField(
  translations: Map<string, unknown>,
  contentId: string,
  field: string,
  legacyArValue: string | null | undefined,
  locale: SupportLocale,
): string | undefined {
  const translated = translations.get(`${contentId}:${field}`);
  if (typeof translated === "string") return translated;
  if (locale === "ar" && legacyArValue) return legacyArValue;
  return undefined;
}

/** Same fallback chain as resolveScalarField, for the `{en, text}[]` word-array fields (word_translations, preview_sentences). */
export function resolveWordArrayField(
  translations: Map<string, unknown>,
  contentId: string,
  field: string,
  legacyArValue: { en: string; ar: string }[] | null | undefined,
  locale: SupportLocale,
): WordTranslation[] | undefined {
  const translated = translations.get(`${contentId}:${field}`);
  if (Array.isArray(translated)) return translated as WordTranslation[];
  if (locale === "ar" && legacyArValue) {
    return legacyArValue.map((pair) => ({ en: pair.en, text: pair.ar }));
  }
  return undefined;
}

/**
 * Dev-only "this content item has no translation for the active locale"
 * signal — logs once per (contentType, contentId, field, locale) per server
 * process, not on every render, so a lesson list page doesn't spam the
 * console once per row on every request. Production is silent: the caller
 * still gets the English fallback text either way, this is purely a
 * missing-content-coverage detector for content authors/admins, satisfying
 * the "detect missing translations in dev" requirement without any runtime
 * cost in production.
 */
const warnedOnce = new Set<string>();

export function warnIfMissing(
  resolved: string | WordTranslation[] | undefined,
  contentType: ContentType,
  contentId: string,
  field: string,
  locale: SupportLocale,
): void {
  if (process.env.NODE_ENV === "production") return;
  if (resolved !== undefined) return;

  const key = `${contentType}:${contentId}:${field}:${locale}`;
  if (warnedOnce.has(key)) return;
  warnedOnce.add(key);
  console.warn(
    `[i18n] missing "${locale}" translation for ${contentType} "${contentId}" field "${field}" — falling back to English.`,
  );
}
