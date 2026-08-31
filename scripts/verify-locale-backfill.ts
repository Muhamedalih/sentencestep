/**
 * Read-only verification that supabase/migrations/20250122000000_locale_foundation.sql's
 * Arabic backfill into content_translations exactly matches the legacy
 * `_ar`-suffixed columns it was generated from. Run this once, manually,
 * right after applying that migration — mirrors
 * scripts/check-content-integrity.ts's shape (service-role credentials,
 * not wired into `npm test`, on-demand only).
 *
 * Run with: npx tsx scripts/verify-locale-backfill.ts
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. from .env.local) before running this.",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let problems = 0;

function report(message: string): void {
  problems += 1;
  console.error(`✗ ${message}`);
}

type TranslationRow = { content_type: string; content_id: string; field: string; value: unknown };

function translationMap(rows: TranslationRow[]): Map<string, unknown> {
  return new Map(
    rows.map((row) => [`${row.content_type}:${row.content_id}:${row.field}`, row.value]),
  );
}

function wordArrayMatches(
  legacy: { en: string; ar: string }[] | null,
  translated: unknown,
): boolean {
  if (!legacy) return translated === undefined;
  if (!Array.isArray(translated)) return false;
  if (translated.length !== legacy.length) return false;
  return legacy.every((pair, index) => {
    const entry = translated[index] as { en?: string; text?: string } | undefined;
    return entry?.en === pair.en && entry?.text === pair.ar;
  });
}

/**
 * A plain `.select()` is silently capped at PostgREST's default max-rows
 * (1000) — content_translations has 2000+ Arabic rows alone, so an
 * unpaginated fetch here would truncate arMap and report false mismatches
 * for every row past the cutoff. The app itself never hits this: every real
 * caller (getContentTranslations) scopes its query to one content_type plus
 * a specific batch of ids, always well under 1000 rows.
 */
async function fetchAllTranslationRows(): Promise<TranslationRow[]> {
  const pageSize = 1000;
  const rows: TranslationRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("content_translations")
      .select("content_type, content_id, field, value")
      .eq("locale", "ar")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function main() {
  const translations = await fetchAllTranslationRows();
  const arMap = translationMap(translations ?? []);
  let checked = 0;

  const { data: levels, error: levelsError } = await supabase
    .from("levels")
    .select("id, title_ar, preview_sentences");
  if (levelsError) throw levelsError;
  for (const level of levels ?? []) {
    checked += 1;
    if (arMap.get(`level:${level.id}:title`) !== level.title_ar) {
      report(`level ${level.id}: title mismatch`);
    }
    const previewValue = arMap.get(`level:${level.id}:preview_sentences`);
    const legacyPreviews = level.preview_sentences ?? [];
    if (!wordArrayMatches(legacyPreviews.length > 0 ? legacyPreviews : null, previewValue)) {
      // An empty legacy array backfills to '[]', not "absent" — checked separately.
      const isEmptyBoth =
        legacyPreviews.length === 0 && Array.isArray(previewValue) && previewValue.length === 0;
      if (!isEmptyBoth) report(`level ${level.id}: preview_sentences mismatch`);
    }
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, title_ar, description_ar");
  if (lessonsError) throw lessonsError;
  for (const lesson of lessons ?? []) {
    checked += 1;
    if (arMap.get(`lesson:${lesson.id}:title`) !== lesson.title_ar) {
      report(`lesson ${lesson.id}: title mismatch`);
    }
    const descValue = arMap.get(`lesson:${lesson.id}:description`);
    if (lesson.description_ar !== null && descValue !== lesson.description_ar) {
      report(`lesson ${lesson.id}: description mismatch`);
    }
    if (lesson.description_ar === null && descValue !== undefined) {
      report(
        `lesson ${lesson.id}: description should be absent (legacy was null) but a row exists`,
      );
    }
  }

  const { data: sentences, error: sentencesError } = await supabase
    .from("sentences")
    .select("id, ar, word_translations");
  if (sentencesError) throw sentencesError;
  for (const sentence of sentences ?? []) {
    checked += 1;
    if (arMap.get(`sentence:${sentence.id}:text`) !== sentence.ar) {
      report(`sentence ${sentence.id}: text mismatch`);
    }
    const wtValue = arMap.get(`sentence:${sentence.id}:word_translations`);
    if (!wordArrayMatches(sentence.word_translations, wtValue)) {
      report(`sentence ${sentence.id}: word_translations mismatch`);
    }
  }

  const { data: wordGroups, error: wordGroupsError } = await supabase
    .from("word_groups")
    .select("id, title_ar, description_ar");
  if (wordGroupsError) throw wordGroupsError;
  for (const group of wordGroups ?? []) {
    checked += 1;
    if (arMap.get(`word_group:${group.id}:title`) !== group.title_ar) {
      report(`word_group ${group.id}: title mismatch`);
    }
    const descValue = arMap.get(`word_group:${group.id}:description`);
    if (group.description_ar !== null && descValue !== group.description_ar) {
      report(`word_group ${group.id}: description mismatch`);
    }
  }

  const { data: vocabWords, error: vocabWordsError } = await supabase
    .from("vocabulary_words")
    .select("id, hint_ar");
  if (vocabWordsError) throw vocabWordsError;
  for (const word of vocabWords ?? []) {
    checked += 1;
    if (arMap.get(`vocabulary_word:${word.id}:hint`) !== word.hint_ar) {
      report(`vocabulary_word ${word.id}: hint mismatch`);
    }
  }

  if (problems === 0) {
    console.log(
      `✓ ${checked} content rows checked against ${translations?.length ?? 0} backfilled translations, all match.`,
    );
  } else {
    console.error(`\n${problems} problem(s) found.`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("verify-locale-backfill failed:", error);
  process.exit(1);
});
