import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";
import { getTranslations } from "@/lib/admin/translations";
import type { ContentStatus } from "@/lib/admin/validation";
import type { LearningMode, PreviewSentence } from "@/types/content";
import type { LessonRole } from "@/types/database";

/**
 * Admin-only reads against the content tables — relies on the admin RLS
 * policies added in the Milestone 11 migration (is_admin() grants full
 * visibility regardless of status/access) rather than the service-role
 * client, since these are real product tables an authorized admin's own
 * session should legitimately be able to read, not a system-internal
 * ledger. Callers (the admin pages) are responsible for checking
 * isSupabaseConfigured() first — these assume a real connection, matching
 * how src/lib/supabase/queries/content.ts's functions already behave.
 */

export interface AdminLevel {
  id: string;
  mode: LearningMode;
  index: number;
  title: string;
  titleAr: string;
  /** From content_translations (locale='es'), not a sibling column — see supabase/migrations/20250122000000_locale_foundation.sql. Empty string means no Spanish title yet. */
  titleEs: string;
  /** "Start Simple" homepage preview sentences (see updateLevelPreview in content-actions.ts). Each entry's `es` (if any) also comes from content_translations. */
  previewSentences: PreviewSentence[];
}

export async function listLevels(mode?: LearningMode): Promise<AdminLevel[]> {
  const supabase = await createClient();
  let query = supabase
    .from("levels")
    .select("*")
    .order("mode", { ascending: true })
    .order("index", { ascending: true });
  if (mode) query = query.eq("mode", mode);

  const { data, error } = await query;
  if (error) throw error;

  const levelIds = (data ?? []).map((row) => row.id);
  const translations = await getTranslations("es", "level", levelIds);

  return (data ?? []).map((row) => {
    const titleEs = translations.get(`${row.id}:title`);
    const previewEs = translations.get(`${row.id}:preview_sentences`);
    const previewEsByEn = new Map(
      Array.isArray(previewEs)
        ? (previewEs as { en?: string; text?: string }[]).map((p) => [p.en, p.text])
        : [],
    );

    return {
      id: row.id,
      mode: row.mode,
      index: row.index,
      title: row.title,
      titleAr: row.title_ar,
      titleEs: typeof titleEs === "string" ? titleEs : "",
      previewSentences: (row.preview_sentences ?? []).map((sentence) => ({
        ...sentence,
        es: previewEsByEn.get(sentence.en) ?? undefined,
      })),
    };
  });
}

export interface AdminLessonSummary {
  id: string;
  mode: LearningMode;
  title: string;
  titleAr: string;
  level: number;
  isFree: boolean;
  status: ContentStatus;
  orderIndex: number;
  createdAt: string;
  sentenceCount: number;
}

export interface ContentListFilters {
  mode?: LearningMode;
  level?: number;
  access?: "free" | "premium";
  status?: ContentStatus;
  search?: string;
}

export interface ContentListPage {
  lessons: AdminLessonSummary[];
  totalCount: number;
}

/** Matches the row-per-page shape admins actually work with (a handful of screens at today's ~80-lesson scale) — small enough to keep prev/next simple, large enough that filtering is rarely needed just to avoid paging. */
export const CONTENT_PAGE_SIZE = 25;

export async function listContentLessons(
  filters: ContentListFilters = {},
  page = 1,
): Promise<ContentListPage> {
  const supabase = await createClient();

  // `level` (the human-facing level *number*) isn't a column on `lessons` —
  // only level_id is, and the number lives on the referenced `levels` row.
  // Resolving it to concrete level_ids first (rather than fetching every
  // matching lesson and filtering by level in application code, the
  // previous approach) is what lets the actual database query — and its
  // `count` — reflect this filter, which real server-side pagination
  // requires: a page can't come back short, or a total-pages count be
  // wrong, because a filter was silently applied after the page was already
  // sliced.
  let levelIds: string[] | undefined;
  if (filters.level) {
    let levelQuery = supabase.from("levels").select("id").eq("index", filters.level);
    if (filters.mode) levelQuery = levelQuery.eq("mode", filters.mode);
    const { data: levelRows, error: levelError } = await levelQuery;
    if (levelError) throw levelError;
    levelIds = (levelRows ?? []).map((row) => row.id);
    if (levelIds.length === 0) return { lessons: [], totalCount: 0 };
  }

  let query = supabase
    .from("lessons")
    .select("*", { count: "exact" })
    .order("mode", { ascending: true })
    .order("order_index", { ascending: true });

  if (filters.mode) query = query.eq("mode", filters.mode);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.access === "free") query = query.eq("is_free", true);
  if (filters.access === "premium") query = query.eq("is_free", false);
  if (filters.search) query = query.ilike("title", `%${filters.search}%`);
  if (levelIds) query = query.in("level_id", levelIds);

  const offset = (Math.max(1, page) - 1) * CONTENT_PAGE_SIZE;
  query = query.range(offset, offset + CONTENT_PAGE_SIZE - 1);

  const { data: lessons, error: lessonsError, count } = await query;
  if (lessonsError) throw lessonsError;
  if (!lessons || lessons.length === 0) return { lessons: [], totalCount: count ?? 0 };

  const [{ data: levels, error: levelsError }, { data: sentences, error: sentencesError }] =
    await Promise.all([
      supabase.from("levels").select("id, index"),
      supabase
        .from("sentences")
        .select("lesson_id")
        .in(
          "lesson_id",
          lessons.map((lesson) => lesson.id),
        ),
    ]);
  if (levelsError) throw levelsError;
  if (sentencesError) throw sentencesError;

  const levelIndexById = new Map((levels ?? []).map((level) => [level.id, level.index]));
  const sentenceCountByLesson = new Map<string, number>();
  for (const sentence of sentences ?? []) {
    sentenceCountByLesson.set(
      sentence.lesson_id,
      (sentenceCountByLesson.get(sentence.lesson_id) ?? 0) + 1,
    );
  }

  const rows: AdminLessonSummary[] = lessons.map((lesson) => ({
    id: lesson.id,
    mode: lesson.mode,
    title: lesson.title,
    titleAr: lesson.title_ar,
    level: levelIndexById.get(lesson.level_id) ?? 0,
    isFree: lesson.is_free,
    status: lesson.status,
    orderIndex: lesson.order_index,
    createdAt: lesson.created_at,
    sentenceCount: sentenceCountByLesson.get(lesson.id) ?? 0,
  }));

  return { lessons: rows, totalCount: count ?? 0 };
}

export interface AdminSentence {
  id: string;
  en: string;
  ar: string;
  /** From content_translations (locale='es'). Empty string means no Spanish translation yet. */
  es: string;
  /** From content_translations (locale='tr'). Empty string means no Turkish translation yet. */
  tr: string;
  speaker: string | null;
  audioUrl: string | null;
}

export interface AdminLessonDetail extends AdminLessonSummary {
  levelId: string;
  illustrationUrl: string | null;
  description: string | null;
  descriptionAr: string | null;
  /** From content_translations (locale='es'). Empty string means no Spanish description yet. */
  descriptionEs: string;
  /** From content_translations (locale='tr'). Empty string means no Turkish description yet. */
  descriptionTr: string;
  /** From content_translations (locale='es'). Empty string means no Spanish title yet. */
  titleEs: string;
  /** From content_translations (locale='tr'). Empty string means no Turkish title yet. */
  titleTr: string;
  sentences: AdminSentence[];
  /** Per-lesson voice override — null means "use the global default" (see resolveVoiceId). */
  voiceId: string | null;
  /** The unit this lesson belongs to, if any — see 20250146000000_curriculum_units.sql. Null for lessons not yet assigned to one. */
  unitId: string | null;
  /** This lesson's job within its unit (see LessonRole) — null exactly when unitId is null. */
  role: LessonRole | null;
}

export async function getContentLessonById(id: string): Promise<AdminLessonDetail | null> {
  const supabase = await createClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (lessonError) throw lessonError;
  if (!lesson) return null;

  const [{ data: level, error: levelError }, { data: sentences, error: sentencesError }] =
    await Promise.all([
      supabase.from("levels").select("index").eq("id", lesson.level_id).maybeSingle(),
      supabase.from("sentences").select("*").eq("lesson_id", id).order("order_index"),
    ]);
  if (levelError) throw levelError;
  if (sentencesError) throw sentencesError;

  const sentenceIds = (sentences ?? []).map((row) => row.id);
  const [
    lessonTranslationsEs,
    lessonTranslationsTr,
    sentenceTranslationsEs,
    sentenceTranslationsTr,
  ] = await Promise.all([
    getTranslations("es", "lesson", [lesson.id]),
    getTranslations("tr", "lesson", [lesson.id]),
    getTranslations("es", "sentence", sentenceIds),
    getTranslations("tr", "sentence", sentenceIds),
  ]);
  const titleEs = lessonTranslationsEs.get(`${lesson.id}:title`);
  const titleTr = lessonTranslationsTr.get(`${lesson.id}:title`);
  const descriptionEs = lessonTranslationsEs.get(`${lesson.id}:description`);
  const descriptionTr = lessonTranslationsTr.get(`${lesson.id}:description`);

  return {
    id: lesson.id,
    mode: lesson.mode,
    title: lesson.title,
    titleAr: lesson.title_ar,
    titleEs: typeof titleEs === "string" ? titleEs : "",
    titleTr: typeof titleTr === "string" ? titleTr : "",
    level: level?.index ?? 0,
    levelId: lesson.level_id,
    isFree: lesson.is_free,
    status: lesson.status,
    illustrationUrl: lesson.illustration_url,
    description: lesson.description,
    descriptionAr: lesson.description_ar,
    descriptionEs: typeof descriptionEs === "string" ? descriptionEs : "",
    descriptionTr: typeof descriptionTr === "string" ? descriptionTr : "",
    voiceId: lesson.voice_id,
    unitId: lesson.unit_id,
    role: lesson.role,
    orderIndex: lesson.order_index,
    createdAt: lesson.created_at,
    sentenceCount: (sentences ?? []).length,
    sentences: (sentences ?? []).map((row) => {
      const es = sentenceTranslationsEs.get(`${row.id}:text`);
      const tr = sentenceTranslationsTr.get(`${row.id}:text`);
      return {
        id: row.id,
        en: row.en,
        ar: row.ar,
        es: typeof es === "string" ? es : "",
        tr: typeof tr === "string" ? tr : "",
        speaker: row.speaker,
        audioUrl: row.audio_url,
      };
    }),
  };
}

export interface CurriculumLessonRow {
  id: string;
  title: string;
  level: number;
  orderIndex: number;
  unitId: string | null;
  unitTitle: string | null;
  unitObjective: string | null;
  /** The unit's own display position among this mode's units (1, 2, 3, ...) — units.order_index. */
  unitOrderIndex: number | null;
  role: LessonRole | null;
  sentences: { en: string }[];
}

/**
 * Every published lesson's sentence text plus its curriculum position
 * (level, order, unit, role) for one mode — the shared fetch behind both
 * getNormalCurriculumForRecycling and getStoriesCurriculumForAdvisory.
 * Deliberately published-only: comparing against a draft would compare
 * against content no learner has actually reached.
 *
 * Three queries total regardless of curriculum size (levels, units, lessons
 * up front, then one batched sentence fetch keyed on every lesson id at
 * once) — never a query per lesson. The caller is responsible for
 * level-then-order sorting, matching findCurrentLesson/findNextLesson
 * (src/lib/progress/level.ts, src/lib/content-helpers.ts) — the same
 * ordering fix from Part 1, since that's the learner's actual path through
 * the curriculum.
 */
async function getCurriculumRowsForMode(mode: LearningMode): Promise<CurriculumLessonRow[]> {
  const supabase = await createClient();

  const [
    { data: levels, error: levelsError },
    { data: units, error: unitsError },
    { data: lessons, error: lessonsError },
  ] = await Promise.all([
    supabase.from("levels").select("id, index").eq("mode", mode),
    supabase.from("units").select("id, title, objective, order_index").eq("mode", mode),
    supabase
      .from("lessons")
      .select("id, title, level_id, order_index, unit_id, role")
      .eq("mode", mode)
      .eq("status", "published")
      .order("order_index"),
  ]);
  if (levelsError) throw levelsError;
  if (unitsError) throw unitsError;
  if (lessonsError) throw lessonsError;

  const levelIndexById = new Map((levels ?? []).map((level) => [level.id, level.index]));
  const unitById = new Map((units ?? []).map((unit) => [unit.id, unit]));

  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);
  const { data: sentences, error: sentencesError } =
    lessonIds.length > 0
      ? await supabase.from("sentences").select("lesson_id, en").in("lesson_id", lessonIds)
      : { data: [], error: null };
  if (sentencesError) throw sentencesError;

  const sentencesByLesson = new Map<string, { en: string }[]>();
  for (const sentence of sentences ?? []) {
    const existing = sentencesByLesson.get(sentence.lesson_id) ?? [];
    existing.push({ en: sentence.en });
    sentencesByLesson.set(sentence.lesson_id, existing);
  }

  const rows: CurriculumLessonRow[] = (lessons ?? []).map((lesson) => {
    const unit = lesson.unit_id ? unitById.get(lesson.unit_id) : undefined;
    return {
      id: lesson.id,
      title: lesson.title,
      level: levelIndexById.get(lesson.level_id) ?? 0,
      orderIndex: lesson.order_index,
      unitId: lesson.unit_id,
      unitTitle: unit?.title ?? null,
      unitObjective: unit?.objective ?? null,
      unitOrderIndex: unit?.order_index ?? null,
      role: lesson.role,
      sentences: sentencesByLesson.get(lesson.id) ?? [],
    };
  });

  rows.sort((a, b) => a.level - b.level || a.orderIndex - b.orderIndex);
  return rows;
}

/**
 * Everything the Curriculum Recycling panel (src/lib/admin/curriculum-
 * recycling.ts, rendered from the Normal-mode lesson editor) needs for any
 * Normal lesson, in one call.
 */
export async function getNormalCurriculumForRecycling(): Promise<CurriculumLessonRow[]> {
  return getCurriculumRowsForMode("normal");
}

/**
 * Everything the Stories curriculum-context panel (src/lib/admin/stories-
 * curriculum-context.ts, rendered from the Stories lesson editor) needs for
 * any Story: its coarse per-level unit, and every other published Story's
 * sentence text to compare against. Same shared fetch as
 * getNormalCurriculumForRecycling, just scoped to mode "stories" — Stories
 * units are one per level (see 20250147000000_stories_units.sql), so every
 * row's `role` here is always null by design, not a gap.
 */
export async function getStoriesCurriculumForAdvisory(): Promise<CurriculumLessonRow[]> {
  return getCurriculumRowsForMode("stories");
}

export interface AdminDashboardStats {
  totalByMode: Record<LearningMode, number>;
  freeCount: number;
  premiumCount: number;
  userCount: number | null;
  recent: AdminLessonSummary[];
}

/**
 * The real total registered-user count, independent of the calling admin
 * session's own RLS visibility — see createServiceRoleClient's doc comment
 * for why the RLS-scoped query alone can't be trusted here. Falls back to
 * the RLS-scoped count (today's behavior) when no service-role key is
 * configured, rather than failing the whole dashboard.
 */
async function fetchRegisteredUserCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<number | null> {
  if (isServiceRoleConfigured()) {
    const { count, error } = await createServiceRoleClient()
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (!error) return count ?? null;
  }
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
  return error ? null : (count ?? null);
}

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient();

  const [
    { data: lessons, error: lessonsError },
    userCount,
    { data: recentRows, error: recentError },
  ] = await Promise.all([
    supabase.from("lessons").select("mode, is_free"),
    fetchRegisteredUserCount(supabase),
    supabase.from("lessons").select("*").order("created_at", { ascending: false }).limit(5),
  ]);
  if (lessonsError) throw lessonsError;
  if (recentError) throw recentError;

  const totalByMode: Record<LearningMode, number> = { normal: 0, stories: 0, conversation: 0 };
  let freeCount = 0;
  let premiumCount = 0;
  for (const lesson of lessons ?? []) {
    totalByMode[lesson.mode] += 1;
    if (lesson.is_free) freeCount += 1;
    else premiumCount += 1;
  }

  const levelIds = (recentRows ?? []).map((row) => row.level_id);
  const { data: levels, error: levelsError } =
    levelIds.length > 0
      ? await supabase.from("levels").select("id, index").in("id", levelIds)
      : { data: [], error: null };
  if (levelsError) throw levelsError;
  const levelIndexById = new Map((levels ?? []).map((level) => [level.id, level.index]));

  const recent: AdminLessonSummary[] = (recentRows ?? []).map((row) => ({
    id: row.id,
    mode: row.mode,
    title: row.title,
    titleAr: row.title_ar,
    level: levelIndexById.get(row.level_id) ?? 0,
    isFree: row.is_free,
    status: row.status,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    sentenceCount: 0,
  }));

  return {
    totalByMode,
    freeCount,
    premiumCount,
    userCount,
    recent,
  };
}
