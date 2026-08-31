import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  deriveOverallState,
  requiredTranslationFields,
  summarizeCompleteness,
} from "@/lib/translation/completeness";
import type {
  CompletenessSummary,
  DerivedTranslationState,
  ExistingTranslationRow,
} from "@/lib/translation/completeness";
import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * "lesson" is the only content type actually populated today — word_group
 * and vocabulary_word have no admin authoring UI yet (a separate,
 * explicitly out-of-scope project), so there's no English content for
 * either to translate. The type stays generic on purpose: content_type is
 * already one of exactly these four values at the database level (see the
 * lifecycle-foundation migration's check constraint), so the dashboard's
 * row shape and filters are ready for word-list support without a rewrite
 * once that content exists — this file just never queries for it yet.
 */
export type DashboardContentType = "lesson" | "sentence" | "word_group" | "vocabulary_word";

/**
 * Both query functions below use the service-role client, not the
 * session-aware one — required because sentences' RLS policy ("Free lesson
 * sentences are public; premium requires active access") has no is_admin()
 * bypass, only is_free/an active subscription (see
 * 20250104000000_premium_access.sql). Under the session-aware client, any
 * non-free lesson's sentences would silently read back empty, understating
 * completeness. Both functions are only ever called from pages under
 * src/app/admin/layout.tsx, which already gates on isAdmin() before
 * rendering — service-role is reached only after that authorization has
 * already passed, never as a substitute for it.
 */

export interface DashboardFilters {
  locale: SupportLocale;
  status?: "approved" | "ai_generated" | "failed" | "missing";
  staleOnly?: boolean;
  search?: string;
}

export interface DashboardRow {
  lessonId: string;
  lessonTitle: string;
  mode: string;
  summary: CompletenessSummary;
  state: DerivedTranslationState;
}

const MAX_LESSONS_PER_PAGE = 200;

/**
 * One row per lesson for the chosen locale — batched into exactly three
 * queries regardless of lesson count (lessons, their sentences, and the
 * locale's content_translations rows for all of them), with completeness
 * computed in application code per the explicit "avoid N+1, calculate
 * visible-page completeness in application code" instruction. No
 * materialized view, no stored completeness column — see
 * summarizeCompleteness's own doc comment.
 */
export interface DashboardRowsResult {
  rows: DashboardRow[];
  /** True when the lesson query hit MAX_LESSONS_PER_PAGE — there is no real pagination here yet, so any lesson outside the most-recently-updated MAX_LESSONS_PER_PAGE is invisible on this dashboard regardless of filters, with nothing else to signal that. See the admin panel audit that flagged this as silent, not just inconvenient. */
  truncated: boolean;
}

export async function listTranslationDashboardRows(
  filters: DashboardFilters,
): Promise<DashboardRowsResult> {
  const supabase = createServiceRoleClient();

  let lessonQuery = supabase
    .from("lessons")
    .select("id, title, mode, description")
    .order("updated_at", { ascending: false })
    .limit(MAX_LESSONS_PER_PAGE);
  if (filters.search) lessonQuery = lessonQuery.ilike("title", `%${filters.search}%`);

  const { data: lessons, error: lessonsError } = await lessonQuery;
  if (lessonsError) throw lessonsError;
  if (!lessons || lessons.length === 0) return { rows: [], truncated: false };
  const truncated = lessons.length >= MAX_LESSONS_PER_PAGE;

  const lessonIds = lessons.map((lesson) => lesson.id);

  const { data: sentenceRows, error: sentencesError } = await supabase
    .from("sentences")
    .select("id, lesson_id")
    .in("lesson_id", lessonIds);
  if (sentencesError) throw sentencesError;

  const sentenceIdsByLesson = new Map<string, string[]>();
  for (const row of sentenceRows ?? []) {
    const list = sentenceIdsByLesson.get(row.lesson_id) ?? [];
    list.push(row.id);
    sentenceIdsByLesson.set(row.lesson_id, list);
  }

  const allSentenceIds = (sentenceRows ?? []).map((row) => row.id);
  const [
    { data: lessonTransRows, error: lessonTransError },
    { data: sentenceTransRows, error: sentenceTransError },
  ] = await Promise.all([
    supabase
      .from("content_translations")
      .select("content_type, content_id, field, status, is_stale")
      .eq("content_type", "lesson")
      .eq("locale", filters.locale)
      .in("content_id", lessonIds),
    allSentenceIds.length > 0
      ? supabase
          .from("content_translations")
          .select("content_type, content_id, field, status, is_stale")
          .eq("content_type", "sentence")
          .eq("field", "text")
          .eq("locale", filters.locale)
          .in("content_id", allSentenceIds)
          .limit(MAX_LESSONS_PER_PAGE * 30)
      : Promise.resolve({
          data: [] as {
            content_type: string;
            content_id: string;
            field: string;
            status: string;
            is_stale: boolean;
          }[],
          error: null,
        }),
  ]);
  if (lessonTransError) throw lessonTransError;
  if (sentenceTransError) throw sentenceTransError;

  const existingByLessonId = new Map<string, ExistingTranslationRow[]>();
  for (const row of lessonTransRows ?? []) {
    const list = existingByLessonId.get(row.content_id) ?? [];
    list.push({
      contentType: row.content_type,
      contentId: row.content_id,
      field: row.field,
      status: row.status as ExistingTranslationRow["status"],
      isStale: row.is_stale,
    });
    existingByLessonId.set(row.content_id, list);
  }
  const sentenceLessonId = new Map<string, string>();
  for (const [lessonId, ids] of sentenceIdsByLesson) {
    for (const id of ids) sentenceLessonId.set(id, lessonId);
  }
  for (const row of sentenceTransRows ?? []) {
    const lessonId = sentenceLessonId.get(row.content_id);
    if (!lessonId) continue;
    const list = existingByLessonId.get(lessonId) ?? [];
    list.push({
      contentType: row.content_type,
      contentId: row.content_id,
      field: row.field,
      status: row.status as ExistingTranslationRow["status"],
      isStale: row.is_stale,
    });
    existingByLessonId.set(lessonId, list);
  }

  const rows: DashboardRow[] = lessons.map((lesson) => {
    const required = requiredTranslationFields(lesson, sentenceIdsByLesson.get(lesson.id) ?? []);
    const summary = summarizeCompleteness(required, existingByLessonId.get(lesson.id) ?? []);
    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      mode: lesson.mode,
      summary,
      state: deriveOverallState(summary),
    };
  });

  const filtered = rows.filter((row) => {
    if (filters.staleOnly && row.summary.stale === 0) return false;
    if (filters.status === "approved" && row.state !== "APPROVED") return false;
    if (filters.status === "ai_generated" && row.summary.aiGenerated === 0) return false;
    if (filters.status === "failed" && row.summary.failed === 0) return false;
    if (filters.status === "missing" && row.summary.missing === 0) return false;
    return true;
  });

  return { rows: filtered, truncated };
}

export interface TranslationFieldDetail {
  contentType: "lesson" | "sentence";
  contentId: string;
  field: "title" | "description" | "text";
  label: string;
  englishSource: string;
  translatedValue: string | null;
  status: "missing" | "ai_generated" | "approved" | "failed";
  isStale: boolean;
  sourceSnapshot: string | null;
  generatedAt: string | null;
  reviewedAt: string | null;
  provider: string | null;
  attempts: number;
  lastAttemptError: string | null;
  lastAttemptAt: string | null;
  previousValue: string | null;
}

/** The full field-by-field detail for one lesson×locale, for the dashboard's row-expansion view — English source alongside the current translation and its full lifecycle metadata. */
export async function getLessonTranslationDetail(
  lessonId: string,
  locale: SupportLocale,
): Promise<{ lessonTitle: string; fields: TranslationFieldDetail[] } | null> {
  const supabase = createServiceRoleClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, description")
    .eq("id", lessonId)
    .maybeSingle();
  if (lessonError) throw lessonError;
  if (!lesson) return null;

  const { data: sentenceRows, error: sentencesError } = await supabase
    .from("sentences")
    .select("id, en, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index");
  if (sentencesError) throw sentencesError;
  const sentences = sentenceRows ?? [];

  interface TranslationMetaRow {
    value: unknown;
    status: string;
    is_stale: boolean;
    source_snapshot: string | null;
    generated_at: string | null;
    reviewed_at: string | null;
    provider: string | null;
    attempts: number;
    last_attempt_error: string | null;
    last_attempt_at: string | null;
    previous_value: unknown;
  }
  interface LessonFieldRow extends TranslationMetaRow {
    field: string;
  }
  interface SentenceFieldRow extends TranslationMetaRow {
    content_id: string;
  }

  const [{ data: lessonTrans }, { data: sentenceTrans }] = await Promise.all([
    supabase
      .from("content_translations")
      .select(
        "field, value, status, is_stale, source_snapshot, generated_at, reviewed_at, provider, attempts, last_attempt_error, last_attempt_at, previous_value",
      )
      .eq("content_type", "lesson")
      .eq("content_id", lessonId)
      .eq("locale", locale)
      .returns<LessonFieldRow[]>(),
    sentences.length > 0
      ? supabase
          .from("content_translations")
          .select(
            "content_id, value, status, is_stale, source_snapshot, generated_at, reviewed_at, provider, attempts, last_attempt_error, last_attempt_at, previous_value",
          )
          .eq("content_type", "sentence")
          .eq("field", "text")
          .eq("locale", locale)
          .in(
            "content_id",
            sentences.map((s) => s.id),
          )
          .returns<SentenceFieldRow[]>()
      : Promise.resolve({ data: [] as SentenceFieldRow[] }),
  ]);

  const lessonByField = new Map<string, TranslationMetaRow>(
    (lessonTrans ?? []).map((row) => [row.field, row]),
  );
  const sentenceById = new Map<string, TranslationMetaRow>(
    (sentenceTrans ?? []).map((row) => [row.content_id, row]),
  );

  function detailFrom(
    contentType: "lesson" | "sentence",
    contentId: string,
    field: "title" | "description" | "text",
    label: string,
    englishSource: string,
    row: TranslationMetaRow | undefined,
  ): TranslationFieldDetail {
    // value/previous_value are jsonb at the schema level (also used for
    // array-shaped fields elsewhere, e.g. word_translations), but every row
    // this function ever reads is title/description/text — always a plain
    // string when written by upsertTranslation/writeGeneratedField. status
    // is guaranteed one of exactly these three by the database's own check
    // constraint (see the lifecycle-foundation migration). Narrowed
    // explicitly rather than trusted implicitly, same pattern as generate.ts.
    const translatedValue = typeof row?.value === "string" ? row.value : null;
    const status: TranslationFieldDetail["status"] =
      row && (row.status === "ai_generated" || row.status === "approved" || row.status === "failed")
        ? row.status
        : "missing";
    const previousValue = typeof row?.previous_value === "string" ? row.previous_value : null;

    return {
      contentType,
      contentId,
      field,
      label,
      englishSource,
      translatedValue,
      status,
      isStale: row?.is_stale ?? false,
      sourceSnapshot: row?.source_snapshot ?? null,
      generatedAt: row?.generated_at ?? null,
      reviewedAt: row?.reviewed_at ?? null,
      provider: row?.provider ?? null,
      attempts: row?.attempts ?? 0,
      lastAttemptError: row?.last_attempt_error ?? null,
      lastAttemptAt: row?.last_attempt_at ?? null,
      previousValue,
    };
  }

  const fields: TranslationFieldDetail[] = [
    detailFrom("lesson", lesson.id, "title", "Title", lesson.title, lessonByField.get("title")),
    ...(lesson.description
      ? [
          detailFrom(
            "lesson",
            lesson.id,
            "description",
            "Description",
            lesson.description,
            lessonByField.get("description"),
          ),
        ]
      : []),
    ...sentences.map((s, i) =>
      detailFrom("sentence", s.id, "text", `Sentence ${i + 1}`, s.en, sentenceById.get(s.id)),
    ),
  ];

  return { lessonTitle: lesson.title, fields };
}
