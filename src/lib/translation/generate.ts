import type { SupabaseClient } from "@supabase/supabase-js";

import { GLOSSARY } from "@/lib/translation/glossary";
import { getTranslationProvider } from "@/lib/translation/provider-registry";
import { validateLessonTranslationOutput } from "@/lib/translation/validate";
import type { LessonTranslationOutput } from "@/lib/translation/provider";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export interface GenerationOutcome {
  generated: number;
  skipped: number;
  failed: number;
  /** Human-readable, safe to show an admin — never a raw provider/DB error object. Present whenever something is worth surfacing beyond the bare counts (a provider failure, malformed output, a concurrent-change discard, or "no provider configured"). */
  error?: string;
}

/** One word/phrase-level vocabulary translation, matching resolveWordArrayField's `{en, text}[]` shape exactly — nothing new invented here. */
export interface WordTranslationPair {
  en: string;
  text: string;
}

type FieldValue = string | WordTranslationPair[];

interface TranslatableField {
  contentType: "lesson" | "sentence";
  contentId: string;
  field: "title" | "description" | "text" | "word_translations";
  /**
   * The current English source text for this field, captured at the start
   * of this generation attempt — this exact string becomes source_snapshot
   * on a successful write, and is what the compare-and-swap write later
   * re-checks against. For "word_translations" this is deliberately the
   * sentence's own full English text (not a serialization of the word
   * list): staleness for word-level translations is tied to the same event
   * that would make the sentence text itself stale — the English sentence
   * changing — so both fields share one meaningful source signal.
   */
  en: string;
}

interface ExistingRow {
  status: "ai_generated" | "approved" | "failed";
  source_snapshot: string | null;
  is_stale: boolean;
  attempts: number;
  value: FieldValue | null;
}

/** Exported so callers that need to build a forceFields set (the review dashboard's Regenerate action) use the exact same key format this file keys everything internally by. */
export function keyFor(f: Pick<TranslatableField, "contentType" | "contentId" | "field">): string {
  return `${f.contentType}:${f.contentId}:${f.field}`;
}

function describeField(f: TranslatableField): string {
  return f.contentType === "lesson" ? f.field : `sentence ${f.contentId} (${f.field})`;
}

function isWordPair(value: unknown): value is WordTranslationPair {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).en === "string" &&
    typeof (value as Record<string, unknown>).text === "string"
  );
}

/**
 * Whether a field should be sent for (re)generation: true for anything not
 * currently approved, or for an approved field explicitly named in
 * forceFields (the review dashboard's "Regenerate" action). Locale-agnostic
 * and content-agnostic by construction — it only ever looks at the row's
 * own status, never at which locale it belongs to, which is what makes
 * "no hardcoded locale branch" an actual, checkable property rather than
 * just an intention. Extracted from generateLessonTranslationDraft's field
 * filter purely for direct unit testing; the CAS/write path below is
 * unaffected by this extraction.
 */
export function isFieldEligibleForGeneration(
  status: ExistingRow["status"] | undefined,
  forced: boolean,
): boolean {
  return status !== "approved" || forced;
}

function valueFor(
  field: TranslatableField,
  value: LessonTranslationOutput,
): FieldValue | undefined {
  if (field.field === "title") return value.title;
  if (field.field === "description") return value.description ?? undefined;
  const sentence = value.sentences.find((s) => s.id === field.contentId);
  if (!sentence) return undefined;
  return field.field === "text" ? sentence.text : sentence.words;
}

/**
 * Generates (never approves) a translation draft for one lesson, in one
 * locale, via one batched AI call — the manual "Generate translation" admin
 * action (see src/lib/admin/translation-actions.ts) is the only caller
 * today; a future scheduled sweep (Phase 5) is expected to call this same
 * function with a service-role client instead of a session-aware one,
 * which is why the client is a parameter here rather than constructed
 * inside — authorization is entirely the caller's responsibility (see this
 * function's lack of any admin check), never this function's.
 *
 * Approved fields are never sent for regeneration and never overwritten —
 * they're excluded from the "eligible" set before the AI is ever called,
 * and if the AI call touches nothing eligible, it isn't called at all. The
 * remaining eligible fields still get the *whole* lesson's current English
 * content as context (better translation consistency for pronouns/tone),
 * but only eligible fields' results are ever written.
 */
export async function generateLessonTranslationDraft(
  supabase: DbClient,
  lessonId: string,
  locale: SupportLocale,
  /**
   * Field keys (see keyFor) to include even if currently approved — the
   * review dashboard's explicit "Regenerate" action on one specific
   * approved-but-stale field is the only caller that ever sets this. Every
   * other caller (the manual per-lesson action, the auto-trigger, the
   * bulk action, the cron sweep) omits it, so approved fields stay
   * untouched everywhere else, unchanged from the original design.
   */
  forceFields?: ReadonlySet<string>,
): Promise<GenerationOutcome> {
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, description, level_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (lessonError)
    return { generated: 0, skipped: 0, failed: 0, error: "Couldn't load the lesson." };
  if (!lesson) return { generated: 0, skipped: 0, failed: 0, error: "Lesson not found." };

  const { data: sentenceRows, error: sentencesError } = await supabase
    .from("sentences")
    .select("id, en, order_index, word_translations")
    .eq("lesson_id", lessonId)
    .order("order_index");
  if (sentencesError) {
    return { generated: 0, skipped: 0, failed: 0, error: "Couldn't load the lesson's sentences." };
  }
  const sentences = sentenceRows ?? [];

  /**
   * The English vocabulary highlights per sentence, sourced from the
   * sentence's own canonical word_translations column (the same `{en, ar}[]`
   * shape every locale's word-level coverage is ultimately keyed against —
   * see the locale-foundation migration's backfill) — never invented, never
   * read from another locale's already-translated `en` values, so a
   * mistranslated `en` in some other locale's row can never propagate here.
   */
  const wordKeysBySentenceId = new Map<string, string[]>();
  for (const s of sentences) {
    const legacy = s.word_translations as { en: string; ar: string }[] | null;
    if (legacy && legacy.length > 0)
      wordKeysBySentenceId.set(
        s.id,
        legacy.map((pair) => pair.en),
      );
  }

  const fields: TranslatableField[] = [
    { contentType: "lesson", contentId: lesson.id, field: "title", en: lesson.title },
    ...(lesson.description
      ? [
          {
            contentType: "lesson" as const,
            contentId: lesson.id,
            field: "description" as const,
            en: lesson.description,
          },
        ]
      : []),
    ...sentences.map((s) => ({
      contentType: "sentence" as const,
      contentId: s.id,
      field: "text" as const,
      en: s.en,
    })),
    ...sentences
      .filter((s) => wordKeysBySentenceId.has(s.id))
      .map((s) => ({
        contentType: "sentence" as const,
        contentId: s.id,
        field: "word_translations" as const,
        en: s.en,
      })),
  ];

  const [{ data: lessonTransRows }, { data: sentenceTransRows }] = await Promise.all([
    supabase
      .from("content_translations")
      .select("field, status, source_snapshot, is_stale, attempts, value")
      .eq("content_type", "lesson")
      .eq("content_id", lesson.id)
      .eq("locale", locale),
    sentences.length > 0
      ? supabase
          .from("content_translations")
          .select("content_id, field, status, source_snapshot, is_stale, attempts, value")
          .eq("content_type", "sentence")
          .in("field", ["text", "word_translations"])
          .eq("locale", locale)
          .in(
            "content_id",
            sentences.map((s) => s.id),
          )
      : Promise.resolve({
          data: [] as {
            content_id: string;
            field: string;
            status: string;
            source_snapshot: string | null;
            is_stale: boolean;
            attempts: number;
            value: unknown;
          }[],
        }),
  ]);

  function toFieldValue(raw: unknown): FieldValue | null {
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw.every((p) => isWordPair(p))) return raw as WordTranslationPair[];
    return null;
  }

  const existingByKey = new Map<string, ExistingRow>();
  for (const row of lessonTransRows ?? []) {
    existingByKey.set(
      keyFor({
        contentType: "lesson",
        contentId: lesson.id,
        field: row.field as TranslatableField["field"],
      }),
      {
        status: row.status as ExistingRow["status"],
        source_snapshot: row.source_snapshot,
        is_stale: row.is_stale,
        attempts: row.attempts,
        value: toFieldValue(row.value),
      },
    );
  }
  for (const row of sentenceTransRows ?? []) {
    existingByKey.set(
      keyFor({
        contentType: "sentence",
        contentId: row.content_id,
        field: row.field as TranslatableField["field"],
      }),
      {
        status: row.status as ExistingRow["status"],
        source_snapshot: row.source_snapshot,
        is_stale: row.is_stale,
        attempts: row.attempts,
        value: toFieldValue(row.value),
      },
    );
  }

  const eligible = fields.filter((f) =>
    isFieldEligibleForGeneration(
      existingByKey.get(keyFor(f))?.status,
      forceFields?.has(keyFor(f)) ?? false,
    ),
  );
  const alreadyApprovedCount = fields.length - eligible.length;

  if (eligible.length === 0) {
    return { generated: 0, skipped: alreadyApprovedCount, failed: 0 };
  }

  const provider = getTranslationProvider();
  if (!provider) {
    return {
      generated: 0,
      skipped: alreadyApprovedCount,
      failed: 0,
      error: "No translation provider is configured (ANTHROPIC_API_KEY is not set).",
    };
  }

  let levelLabel: string | undefined;
  if (lesson.level_id) {
    const { data: level } = await supabase
      .from("levels")
      .select("title")
      .eq("id", lesson.level_id)
      .maybeSingle();
    levelLabel = level?.title;
  }

  let rawOutput: unknown;
  try {
    rawOutput = await provider.translateLesson({
      targetLocale: locale,
      title: lesson.title,
      description: lesson.description,
      sentences: sentences.map((s) => ({
        id: s.id,
        en: s.en,
        words: wordKeysBySentenceId.get(s.id) ?? [],
      })),
      levelLabel,
      glossary: GLOSSARY,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordAttemptFailures(supabase, eligible, existingByKey, locale, message);
    return {
      generated: 0,
      skipped: alreadyApprovedCount,
      failed: eligible.length,
      error: `Translation generation failed: ${message}`,
    };
  }

  const validation = validateLessonTranslationOutput(rawOutput, {
    hasDescription: lesson.description != null,
    sentenceIds: sentences.map((s) => s.id),
    sentenceWords: wordKeysBySentenceId,
  });
  if (!validation.valid) {
    const message = `Malformed AI response: ${validation.errors.join(" ")}`;
    await recordAttemptFailures(supabase, eligible, existingByKey, locale, message);
    return { generated: 0, skipped: alreadyApprovedCount, failed: eligible.length, error: message };
  }

  let generated = 0;
  let writeErrors = 0;
  const notes: string[] = [];

  for (const field of eligible) {
    const value = valueFor(field, validation.value);
    if (value === undefined) {
      writeErrors += 1;
      notes.push(`No translated value returned for ${describeField(field)}.`);
      continue;
    }
    const existing = existingByKey.get(keyFor(field));
    const outcome = await writeGeneratedField(supabase, field, value, existing, locale);
    if (outcome === "written") {
      generated += 1;
    } else if (outcome === "discarded") {
      notes.push(
        `${describeField(field)} changed concurrently — AI draft discarded, existing value kept.`,
      );
    } else {
      writeErrors += 1;
      notes.push(`Failed to save the translation for ${describeField(field)}.`);
    }
  }

  const discardedCount = eligible.length - generated - writeErrors;

  return {
    generated,
    skipped: alreadyApprovedCount + discardedCount,
    failed: writeErrors,
    error: notes.length > 0 ? notes.join(" ") : undefined,
  };
}

/**
 * Records a failed attempt (provider error or malformed output) onto every
 * eligible field's existing row, without touching value/status — see
 * upsertTranslation's sibling reasoning in src/lib/admin/translations.ts:
 * a failure must never destroy a previously-good value. Fields with no
 * existing row yet are deliberately skipped here, not given a placeholder
 * row: content_translations.value is NOT NULL, and inventing a value to
 * satisfy that constraint would risk exactly the "a row exists so it reads
 * as translated" problem upsertTranslation's own doc comment warns about.
 * A first-ever failure for a brand-new field is surfaced to the admin only
 * through this attempt's synchronous response, not persisted — acceptable
 * for a manual, admin-paced pipeline where the admin IS the retry
 * mechanism; the scheduled sweep (Phase 5) will need its own bounded-retry
 * design for this same edge case, since nothing there is manually re-run.
 */
async function recordAttemptFailures(
  supabase: DbClient,
  eligible: TranslatableField[],
  existingByKey: Map<string, ExistingRow>,
  locale: SupportLocale,
  errorMessage: string,
): Promise<void> {
  const now = new Date().toISOString();
  const truncated = errorMessage.slice(0, 500);

  await Promise.all(
    eligible.map((field) => {
      const existing = existingByKey.get(keyFor(field));
      if (!existing) return Promise.resolve();

      let query = supabase
        .from("content_translations")
        .update({
          last_attempt_error: truncated,
          last_attempt_at: now,
          attempts: existing.attempts + 1,
        })
        .eq("content_type", field.contentType)
        .eq("content_id", field.contentId)
        .eq("field", field.field)
        .eq("locale", locale)
        .eq("status", existing.status)
        // Same compare-and-swap discipline as writeGeneratedField's success
        // path: gated on the exact `attempts` this run started from, so two
        // concurrent failures for the same field (overlapping cron sweep +
        // manual retry, or two overlapping sweeps) can't both match the same
        // row and silently lose one increment — the second one simply no-ops
        // instead of under-counting, the same way a lost race already
        // "discards" on the success path.
        .eq("attempts", existing.attempts);
      query =
        existing.source_snapshot === null
          ? query.is("source_snapshot", null)
          : query.eq("source_snapshot", existing.source_snapshot);
      return query;
    }),
  );
}

/**
 * Writes one field's validated AI draft. New field (no existing row):
 * plain insert — the primary key itself is the only guard needed, and a
 * conflict there (23505) means another concurrent generation attempt won
 * the race, so this draft is discarded rather than erroring. Existing
 * field: a conditional update gated on the exact status, source_snapshot,
 * AND is_stale observed when this generation attempt started — the
 * optimistic-concurrency guard from the architecture proposal. If any of
 * the three changed in the meantime (an admin approved it, or the English
 * source was edited), the WHERE clause matches zero rows and the update
 * silently no-ops, discarding the now-outdated draft rather than
 * overwriting whatever's newer. `.select()` on the update is what makes
 * that distinguishable from a real success — an empty result means the
 * guard held.
 *
 * is_stale is included in the guard (not just status/source_snapshot)
 * because a concurrent English edit for a locale with no direct legacy
 * column (i.e. not "ar"/"es") only ever reaches this row via
 * markTranslationsStaleIfChanged, which flips is_stale true WITHOUT
 * touching source_snapshot (see that function's own doc comment — it's
 * deliberately value/status/source_snapshot-preserving for approved rows).
 * Without this guard, a generation attempt that read the English source
 * before such an edit landed could still pass a status+source_snapshot-only
 * check (since source_snapshot in the DB hadn't moved) and write back
 * `field.en` — the now-stale English it started with — as a source_snapshot
 * that looks fresh (is_stale: false) but no longer matches the real current
 * source. Guarding on is_stale closes that window for any row that already
 * had a non-null source_snapshot when generation started; a row with no
 * source_snapshot yet (first-ever generation for a brand-new field) is
 * outside markTranslationsStaleIfChanged's own scope too (it never touches
 * null-snapshot rows), so that narrower first-generation-races-first-edit
 * case isn't closed by this guard — see this session's repair-pass report.
 */
async function writeGeneratedField(
  supabase: DbClient,
  field: TranslatableField,
  value: FieldValue,
  existing: ExistingRow | undefined,
  locale: SupportLocale,
): Promise<"written" | "discarded" | "error"> {
  const now = new Date().toISOString();

  if (!existing) {
    const { error } = await supabase.from("content_translations").insert({
      content_type: field.contentType,
      content_id: field.contentId,
      field: field.field,
      locale,
      value,
      status: "ai_generated",
      is_stale: false,
      source_snapshot: field.en,
      previous_value: null,
      generated_at: now,
      provider: "anthropic",
      attempts: 1,
      updated_at: now,
    });
    if (!error) return "written";
    if (error.code === "23505") return "discarded";
    return "error";
  }

  // Only meaningfully populated on a forced regenerate of a currently-
  // approved field (see forceFields on generateLessonTranslationDraft) —
  // the previously-approved value is preserved here so the review
  // dashboard can show a before/after comparison, and isn't lost the
  // instant a new draft lands. For the ordinary (non-approved) overwrite
  // case there's nothing meaningful to preserve, so this stays null.
  const previousValue = existing.status === "approved" ? existing.value : null;

  let query = supabase
    .from("content_translations")
    .update({
      value,
      status: "ai_generated",
      is_stale: false,
      source_snapshot: field.en,
      previous_value: previousValue,
      generated_at: now,
      provider: "anthropic",
      attempts: existing.attempts + 1,
      updated_at: now,
    })
    .eq("content_type", field.contentType)
    .eq("content_id", field.contentId)
    .eq("field", field.field)
    .eq("locale", locale)
    .eq("status", existing.status)
    .eq("is_stale", existing.is_stale);
  query =
    existing.source_snapshot === null
      ? query.is("source_snapshot", null)
      : query.eq("source_snapshot", existing.source_snapshot);

  const { data, error } = await query.select("content_type");
  if (error) return "error";
  return data && data.length > 0 ? "written" : "discarded";
}
