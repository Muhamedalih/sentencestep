import { unstable_cache } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public-client";
import { createClient } from "@/lib/supabase/server";
import { isLearnerVisibleStatus, tallySentenceStats } from "@/lib/content-helpers";
import {
  getContentTranslations,
  resolveScalarField,
  resolveWordArrayField,
  warnIfMissing,
} from "@/lib/i18n/content-translations";
import {
  applyCuratedStoryVocabulary,
  buildStoryVocabulary,
  deriveStoryVocabulary,
} from "@/lib/content/story-vocabulary";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { Database } from "@/types/database";
import type { Lesson, LearningMode, LessonUnit, PreviewSentence, Sentence } from "@/types/content";

/**
 * Supabase-backed content reads, matching the shape of the local seed in
 * src/data/lessons. Only called once isSupabaseConfigured() is true — see
 * src/lib/content.ts, the single place the rest of the app reads lessons
 * from.
 */

type SentenceRow = Database["public"]["Tables"]["sentences"]["Row"];
type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonRowWithSentences = LessonRow & { sentences: SentenceRow[] | null };

/**
 * `locale`/`sentenceTranslations` are optional — every existing caller that
 * doesn't pass them gets the exact same Sentence shape as before (`ar`/
 * `wordTranslations` only, no `supportText`). Passing them additionally
 * populates supportText/supportWordTranslations resolved against the given
 * locale — see types/content.ts's Sentence.supportText doc comment for the
 * fallback chain.
 */
function toSentence(
  row: SentenceRow,
  locale?: SupportLocale,
  sentenceTranslations?: Map<string, unknown>,
): Sentence {
  const sentence: Sentence = {
    id: row.id,
    en: row.en,
    ar: row.ar,
    ...(row.speaker ? { speaker: row.speaker } : {}),
    ...(row.audio_url ? { audioUrl: row.audio_url } : {}),
    ...(row.word_translations ? { wordTranslations: row.word_translations } : {}),
  };

  if (locale && sentenceTranslations) {
    const supportText = resolveScalarField(sentenceTranslations, row.id, "text", row.ar, locale);
    warnIfMissing(supportText, "sentence", row.id, "text", locale);
    if (supportText !== undefined) sentence.supportText = supportText;

    const supportWordTranslations = resolveWordArrayField(
      sentenceTranslations,
      row.id,
      "word_translations",
      row.word_translations,
      locale,
    );
    if (supportWordTranslations !== undefined) {
      sentence.supportWordTranslations = supportWordTranslations;
    }
  }

  return sentence;
}

/**
 * Level display names as authored in the DB (via the admin CMS at
 * /admin/levels), keyed by level index. fetchLessons already reads this
 * same levels table but only keeps the index — this exists so the learner
 * list view can show a real name for any level beyond the three baked into
 * src/data/units.ts, instead of a generic "More Lessons" bucket.
 */
async function fetchLevelNamesUncached(
  mode: LearningMode,
  locale?: SupportLocale,
): Promise<Record<number, { title: string; titleAr: string; supportTitle?: string }>> {
  const supabase = createPublicClient();
  const { data: levels, error } = await supabase
    .from("levels")
    .select("id, index, title, title_ar")
    .eq("mode", mode);

  if (error) throw error;

  const translations = locale
    ? await getContentTranslations(
        "level",
        (levels ?? []).map((level) => level.id),
        locale,
      )
    : undefined;

  const result: Record<number, { title: string; titleAr: string; supportTitle?: string }> = {};
  for (const level of levels ?? []) {
    const entry: { title: string; titleAr: string; supportTitle?: string } = {
      title: level.title,
      titleAr: level.title_ar,
    };
    if (locale && translations) {
      const supportTitle = resolveScalarField(
        translations,
        level.id,
        "title",
        level.title_ar,
        locale,
      );
      warnIfMissing(supportTitle, "level", level.id, "title", locale);
      if (supportTitle !== undefined) entry.supportTitle = supportTitle;
    }
    result[level.index] = entry;
  }
  return result;
}

/**
 * Cached wrapper around fetchLevelNamesUncached — this data is genuinely
 * public (createPublicClient, no session/RLS dependency, unlike fetchLessons
 * below), changes only through the four admin actions in content-actions.ts
 * that call revalidateTag("levels"), and is re-fetched on every "/learn"
 * navigation otherwise. Tagged (not time-based) so an admin edit is reflected
 * immediately rather than after some TTL.
 */
export const fetchLevelNames = unstable_cache(fetchLevelNamesUncached, ["fetch-level-names"], {
  tags: ["levels"],
});

/**
 * Admin-authored "Start Simple" preview sentences (via /admin/levels), keyed
 * by level index — the handful of standalone example sentences shown on the
 * homepage before any lesson, not tied to a lesson/activity. Falls back to
 * an empty array per level when nothing's been authored yet; the caller
 * (src/lib/content.ts's getStartSimplePreviews) is responsible for falling
 * back further to the static src/data/units.ts previews in that case.
 */
async function fetchLevelPreviewsUncached(
  mode: LearningMode,
  locale?: SupportLocale,
): Promise<Record<number, PreviewSentence[]>> {
  const supabase = createPublicClient();
  const { data: levels, error } = await supabase
    .from("levels")
    .select("id, index, preview_sentences")
    .eq("mode", mode);

  if (error) throw error;

  const translations = locale
    ? await getContentTranslations(
        "level",
        (levels ?? []).map((level) => level.id),
        locale,
      )
    : undefined;

  const result: Record<number, PreviewSentence[]> = {};
  for (const level of levels ?? []) {
    const previews = level.preview_sentences ?? [];
    if (!locale || !translations) {
      result[level.index] = previews;
      continue;
    }

    // preview_sentences is legacy-shaped identically to word_translations
    // ({en,ar}[]) — resolveWordArrayField's {en,text}[] output maps
    // directly onto {en, ar, supportText} per entry below.
    const resolvedArray = resolveWordArrayField(
      translations,
      level.id,
      "preview_sentences",
      previews,
      locale,
    );
    warnIfMissing(resolvedArray, "level", level.id, "preview_sentences", locale);

    result[level.index] = previews.map((preview, index) => ({
      ...preview,
      // An entry can exist at this index with an empty `text` — the admin
      // editor stores one row per preview sentence to keep index alignment
      // even when only some of them have a Spanish translation yet (see
      // upsertEsWordArrayTranslation's doc comment). Empty text must fall
      // through to the rest of the chain (ar/es/undefined below), not
      // render as a blank support line.
      ...(resolvedArray?.[index]?.text ? { supportText: resolvedArray[index].text } : {}),
    }));
  }
  return result;
}

/** Cached wrapper around fetchLevelPreviewsUncached — see fetchLevelNames's cached wrapper above for why this is safe to share-cache and how it's invalidated. */
export const fetchLevelPreviews = unstable_cache(
  fetchLevelPreviewsUncached,
  ["fetch-level-previews"],
  { tags: ["levels"] },
);

/**
 * Session-aware, like fetchLessonById (see that function's doc comment for
 * why): the sentences RLS policy checks auth.uid() per-lesson, so a premium
 * lesson's sentences are only visible through a client that actually carries
 * the viewer's session. Reading the list through the anonymous client used
 * to leave `sentences` empty for every non-free lesson regardless of the
 * viewer's real access — invisible for a locked card (which never shows the
 * count), but wrong for an unlocked one: a paying subscriber's own premium
 * story cards showed "0 sentences" for stories that have real content, and
 * an admin's dev-only session hit the same gap since is_admin() also reads
 * auth.uid(). Free lessons were never affected (their sentences are public
 * regardless of session).
 */
// A mode's full sentence table now regularly exceeds a thousand rows once
// word_translations is populated on every row (Stories crossed that point
// once all 132 lessons had it) — a single embedded `sentences(*)` join
// across every lesson in the mode started timing out under that payload
// (measured: UND_ERR timeout on the stories catalog page). Chunking the
// lesson id list mirrors CONTENT_IDS_CHUNK_SIZE's own rationale in
// src/lib/i18n/content-translations.ts, just applied to this query instead.
const LESSON_IDS_CHUNK_SIZE = 40;

export async function fetchLessons(mode: LearningMode, locale?: SupportLocale): Promise<Lesson[]> {
  const supabase = await createClient();

  // levels has no relationship to lessons.mode, so it stays a separate
  // query that fires alongside the lessons query below rather than waiting
  // on it.
  const [{ data: lessonRows, error: lessonsError }, { data: levels, error: levelsError }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("*")
        .eq("mode", mode)
        .eq("status", "published")
        .order("order_index"),
      supabase.from("levels").select("*").eq("mode", mode),
    ]);

  if (lessonsError) throw lessonsError;
  if (levelsError) throw levelsError;
  // Defensive double-check (see isLearnerVisibleStatus's doc comment) — the
  // query above is the real filter, this just means a regression there
  // can't silently leak draft/archived lessons to learners.
  const lessons = (lessonRows ?? []).filter((lesson) =>
    isLearnerVisibleStatus(lesson.status),
  ) as LessonRowWithSentences[];
  if (lessons.length === 0) return [];

  const levelIndexById = new Map((levels ?? []).map((level) => [level.id, level.index]));

  // Sentences are fetched separately (not embedded), chunked by lesson id —
  // see LESSON_IDS_CHUNK_SIZE's doc comment above. Same session-aware
  // client as the lessons query, so the sentences RLS policy (which checks
  // auth.uid() per lesson) is still evaluated identically to before — see
  // this function's own doc comment for why that matters for premium
  // content.
  const lessonIds = lessons.map((lesson) => lesson.id);
  const lessonIdChunks: string[][] = [];
  for (let i = 0; i < lessonIds.length; i += LESSON_IDS_CHUNK_SIZE) {
    lessonIdChunks.push(lessonIds.slice(i, i + LESSON_IDS_CHUNK_SIZE));
  }
  const sentenceResults = await Promise.all(
    lessonIdChunks.map((chunk) =>
      supabase.from("sentences").select("*").in("lesson_id", chunk).order("order_index"),
    ),
  );
  const sentences: SentenceRow[] = [];
  const sentencesByLessonId = new Map<string, SentenceRow[]>();
  for (const { data, error } of sentenceResults) {
    if (error) throw error;
    for (const sentence of data ?? []) {
      sentences.push(sentence);
      const existing = sentencesByLessonId.get(sentence.lesson_id);
      if (existing) existing.push(sentence);
      else sentencesByLessonId.set(sentence.lesson_id, [sentence]);
    }
  }
  for (const lesson of lessons) {
    lesson.sentences = sentencesByLessonId.get(lesson.id) ?? [];
  }
  const sentenceIds = sentences.map((sentence) => sentence.id);
  const [lessonTranslations, sentenceTranslations] = locale
    ? await Promise.all([
        getContentTranslations("lesson", lessonIds, locale),
        getContentTranslations("sentence", sentenceIds, locale),
      ])
    : [undefined, undefined];

  return lessons.map((lesson) => {
    const lessonSentences = ((lesson.sentences ?? []) as SentenceRow[]).map((sentence) =>
      toSentence(sentence, locale, sentenceTranslations),
    );
    const level = levelIndexById.get(lesson.level_id) ?? 1;

    // Stories-only, isolated feature — see buildStoryVocabulary's doc
    // comment. Normal/conversation lessons are untouched by it (storyVocab
    // stays null, so sentences below are exactly what they always were);
    // they instead get a completion-recap vocabulary list derived with the
    // same ranking engine (deriveStoryVocabulary, recap-list-only — it never
    // mutates sentences/in-context markers) when the content itself has no
    // hand-curated one. See LessonCompletion's vocabulary section.
    // Curated (applyCuratedStoryVocabulary) takes priority over the
    // heuristic when this lesson has authored target words — see that
    // function's own doc comment.
    const storyVocab =
      mode === "stories"
        ? (applyCuratedStoryVocabulary(lessonSentences, lesson.id) ??
          buildStoryVocabulary(lessonSentences, level, lesson.title))
        : null;
    const derivedVocabulary = storyVocab
      ? null
      : deriveStoryVocabulary(lessonSentences, level, lesson.title);

    const unit: Lesson = {
      id: lesson.id,
      mode: lesson.mode,
      level,
      order: lesson.order_index,
      title: lesson.title,
      titleAr: lesson.title_ar,
      isFree: lesson.is_free,
      illustrationUrl: lesson.illustration_url ?? undefined,
      description: lesson.description ?? undefined,
      descriptionAr: lesson.description_ar ?? undefined,
      voiceId: lesson.voice_id ?? undefined,
      sentences: storyVocab ? storyVocab.sentences : lessonSentences,
      ...(storyVocab
        ? { vocabulary: storyVocab.vocabulary }
        : derivedVocabulary && derivedVocabulary.length > 0
          ? { vocabulary: derivedVocabulary }
          : {}),
    };

    if (locale && lessonTranslations) {
      const supportTitle = resolveScalarField(
        lessonTranslations,
        lesson.id,
        "title",
        lesson.title_ar,
        locale,
      );
      warnIfMissing(supportTitle, "lesson", lesson.id, "title", locale);
      if (supportTitle !== undefined) unit.supportTitle = supportTitle;

      const supportDescription = resolveScalarField(
        lessonTranslations,
        lesson.id,
        "description",
        lesson.description_ar,
        locale,
      );
      if (supportDescription !== undefined) unit.supportDescription = supportDescription;
    }

    return unit;
  });
}

/**
 * What the Home dashboard needs from a mode's lessons — title, level, order,
 * illustration, free/premium — and NOTHING from their bodies: no sentences, no
 * word translations, no per-sentence support translations, no vocabulary
 * derivation. Home used to call fetchLessons (above) for all three modes just
 * to show the "up next" cards and to count sentences/words, which meant
 * downloading every sentence with its word_translations (over a thousand rows
 * for Stories alone), running the vocabulary ranking over all of them, and
 * then shipping every sentence body to the browser inside HomeHero's props.
 *
 * Reads only the `lessons`/`levels`/lesson-title translation rows, all of which
 * are public for a published lesson (see fetchLessonNav's doc comment for the
 * RLS reasoning), so this is safe to share-cache across every viewer exactly
 * like fetchLessonNav — same invalidation tags, plus a short time-based expiry
 * as a backstop for lesson-title translation edits, which have no tag of their
 * own. A warm cache makes this cost nothing on Home.
 */
async function fetchLessonSummariesUncached(
  mode: LearningMode,
  locale?: SupportLocale,
): Promise<LessonUnit[]> {
  const supabase = createPublicClient();
  const [{ data: lessonRows, error: lessonsError }, { data: levels, error: levelsError }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select(
          "id, mode, level_id, order_index, title, title_ar, description, description_ar, is_free, status, illustration_url",
        )
        .eq("mode", mode)
        .eq("status", "published")
        .order("order_index"),
      supabase.from("levels").select("id, index").eq("mode", mode),
    ]);
  if (lessonsError) throw lessonsError;
  if (levelsError) throw levelsError;

  // Same defensive double-check as fetchLessons — see isLearnerVisibleStatus's doc comment.
  const lessons = (lessonRows ?? []).filter((lesson) => isLearnerVisibleStatus(lesson.status));
  if (lessons.length === 0) return [];

  const levelIndexById = new Map((levels ?? []).map((level) => [level.id, level.index]));
  const lessonTranslations = locale
    ? await getContentTranslations(
        "lesson",
        lessons.map((lesson) => lesson.id),
        locale,
      )
    : undefined;

  return lessons.map((lesson) => {
    const unit: LessonUnit = {
      id: lesson.id,
      mode: lesson.mode,
      level: levelIndexById.get(lesson.level_id) ?? 1,
      order: lesson.order_index,
      title: lesson.title,
      titleAr: lesson.title_ar,
      isFree: lesson.is_free,
      illustrationUrl: lesson.illustration_url ?? undefined,
      description: lesson.description ?? undefined,
      descriptionAr: lesson.description_ar ?? undefined,
      sentences: [],
    };
    if (locale && lessonTranslations) {
      const supportTitle = resolveScalarField(
        lessonTranslations,
        lesson.id,
        "title",
        lesson.title_ar,
        locale,
      );
      if (supportTitle !== undefined) unit.supportTitle = supportTitle;
      const supportDescription = resolveScalarField(
        lessonTranslations,
        lesson.id,
        "description",
        lesson.description_ar,
        locale,
      );
      if (supportDescription !== undefined) unit.supportDescription = supportDescription;
    }
    return unit;
  });
}

export const fetchLessonSummaries = unstable_cache(
  fetchLessonSummariesUncached,
  ["fetch-lesson-summaries"],
  { tags: ["lesson-nav", "levels"], revalidate: 300 },
);

/** Ids per request — this reads two short columns, so it can take far more than fetchLessons' 40, while staying well inside URL length limits. */
const SENTENCE_STATS_CHUNK_SIZE = 60;

/**
 * Sentence and word counts for the given lessons — everything the Home stats
 * row needs from their bodies, fetched as just `lesson_id` + the English text
 * (never word_translations, audio URLs or translations). Session-aware, for
 * the same reason as fetchLessons: the sentences RLS policy is per-viewer, so a
 * premium lesson the viewer can't open simply has no rows here, exactly as its
 * `sentences` was empty before. A failure degrades to "no counts" rather than
 * taking the whole dashboard down over a statistic.
 */
export async function fetchLessonSentenceStats(
  lessonIds: string[],
): Promise<Map<string, { sentences: number; words: number }>> {
  const stats = new Map<string, { sentences: number; words: number }>();
  if (lessonIds.length === 0) return stats;
  try {
    const supabase = await createClient();
    const chunks: string[][] = [];
    for (let i = 0; i < lessonIds.length; i += SENTENCE_STATS_CHUNK_SIZE) {
      chunks.push(lessonIds.slice(i, i + SENTENCE_STATS_CHUNK_SIZE));
    }
    const results = await Promise.all(
      chunks.map((chunk) =>
        supabase.from("sentences").select("lesson_id, en").in("lesson_id", chunk),
      ),
    );
    for (const { data, error } of results) {
      if (error) throw error;
      // A lesson id lives in exactly one chunk, so per-chunk tallies never overlap.
      for (const [lessonId, counts] of tallySentenceStats(data ?? [])) stats.set(lessonId, counts);
    }
  } catch (error) {
    console.error("[content] fetchLessonSentenceStats failed", error);
    return new Map();
  }
  return stats;
}

/** The subset of a lesson findNextLesson actually needs to pick the next one and build its `/learn/{mode}/{id}` link — see fetchLessonNav's doc comment. `isFree` is only there so the lesson page can tell a learner, before they tap it, that the next lesson is Premium. */
export interface LessonNavEntry {
  id: string;
  mode: LearningMode;
  level: number;
  order: number;
  isFree: boolean;
}

type LessonNavRow = Pick<LessonRow, "id" | "mode" | "order_index" | "status" | "is_free"> & {
  levels: Pick<Database["public"]["Tables"]["levels"]["Row"], "index"> | null;
};

/**
 * A lightweight stand-in for fetchLessons, used only to find the lesson that
 * comes after a given one (see the lesson page's `nextLesson` prop, which
 * only ever reads `.id`/`.mode` off the result — never its title, sentences,
 * or anything else a full Lesson carries). The lesson page used to call the
 * full fetchLessons(mode, locale) for this alone, which meant loading every
 * lesson's complete sentence body (and, for stories mode, running full
 * vocabulary derivation on all of them) on every single lesson page view
 * just to compute one adjacent id — by far the most expensive call on that
 * page after fetchLessons' own two-round-trip shape. This does the one
 * round trip it actually needs: id/order/status plus the level's index via
 * the same lessons.level_id -> levels.id embed fetchLessons uses, no
 * sentences, no translations, no per-mode vocabulary derivation.
 */
async function fetchLessonNavUncached(mode: LearningMode): Promise<LessonNavEntry[]> {
  // createPublicClient, not createClient: this cached wrapper is not just
  // *safe* to share across viewers (see its own doc comment on why the
  // `lessons` RLS policy makes that true) — Next.js actively forbids
  // reading cookies() inside an unstable_cache()-wrapped function at all
  // (confirmed live: "used 'cookies' inside a function cached with
  // 'unstable_cache(...)'" the moment this used the session-aware client),
  // and createClient() reads cookies() to build its client regardless of
  // whether the query itself ends up depending on the session. Same
  // anonymous-client pattern fetchLevelNames/fetchLevelPreviews already use
  // just above for the identical reason.
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("id, mode, order_index, status, is_free, levels(index)")
    .eq("mode", mode)
    .eq("status", "published")
    .order("order_index");

  if (error) throw error;

  // Same defensive double-check as fetchLessons — see isLearnerVisibleStatus's
  // doc comment.
  return ((data ?? []) as unknown as LessonNavRow[])
    .filter((lesson) => isLearnerVisibleStatus(lesson.status))
    .map((lesson) => ({
      id: lesson.id,
      mode: lesson.mode,
      level: lesson.levels?.index ?? 1,
      order: lesson.order_index,
      isFree: lesson.is_free,
    }));
}

/**
 * Cached wrapper around fetchLessonNavUncached — safe to share-cache across
 * every viewer, unlike fetchLessons/fetchLessonById just below (see those
 * functions' own doc comments): this query only ever reads the `lessons`
 * table, whose RLS policy ("Published lessons are public; admins see all",
 * see supabase/migrations/20250108000000_admin_cms.sql) has no auth.uid()
 * check for a published row — unlike `sentences`, which this query never
 * touches at all. A published lesson's id/mode/order/level is therefore
 * byte-identical for a guest, a free learner, a premium subscriber, and an
 * admin alike, which is exactly what makes one shared cache entry safe here
 * (fetchLessons/fetchLessonById below embed `sentences`, whose RLS answer
 * genuinely differs per viewer, so those are deliberately NOT cached this
 * way). Invalidated by every admin action that can change a lesson's
 * status/order/mode — see content-actions.ts's
 * saveLesson/archiveLesson/restoreLesson/bulkUpdateLessonStatus, all of
 * which call revalidateTag("lesson-nav").
 */
export const fetchLessonNav = unstable_cache(fetchLessonNavUncached, ["fetch-lesson-nav-v2"], {
  tags: ["lesson-nav"],
});

/**
 * Unlike fetchLessons (list views, and generateStaticParams which has no
 * request to read a session from — both only ever need free-lesson data),
 * this is only ever called from a real per-request lesson-page render, so
 * it uses the session-aware server client. That matters once premium
 * lessons exist: the sentences RLS policy checks auth.uid(), and a request
 * made through the anonymous client would never resolve to a real
 * subscriber, silently returning no sentences even for a paying user.
 */
export async function fetchLessonById(
  mode: LearningMode,
  id: string,
  locale?: SupportLocale,
): Promise<Lesson | undefined> {
  const supabase = await createClient();

  // Both queries below only need `id`/`mode`, which are already known from
  // the caller — this used to fetch the lesson row first and only start the
  // level+sentences pair once it resolved, but neither of those actually
  // depends on anything read back off that row: the sentences filter uses
  // `id` directly (identical to lesson.id once the row exists), and the
  // level is now embedded on the lessons query itself via the same
  // lessons.level_id -> levels.id join fetchLessons uses, instead of a
  // separate lookup keyed off lesson.level_id. So both fire together as one
  // round trip instead of two sequential ones. The lesson-not-found/
  // not-published case still fires the sentences query for nothing, but
  // that's the rare path — the common case (a real lesson id) was always
  // going to need both anyway.
  const [{ data: lesson, error: lessonError }, { data: sentences, error: sentencesError }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("*, levels(*)")
        .eq("mode", mode)
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle(),
      supabase.from("sentences").select("*").eq("lesson_id", id).order("order_index"),
    ]);

  if (lessonError) throw lessonError;
  if (sentencesError) throw sentencesError;
  // Defensive double-check, see isLearnerVisibleStatus's doc comment.
  if (!lesson || !isLearnerVisibleStatus(lesson.status)) return undefined;

  const level = (
    lesson as unknown as { levels: Database["public"]["Tables"]["levels"]["Row"] | null }
  ).levels;

  const sentenceIds = (sentences ?? []).map((sentence) => sentence.id);
  const [lessonTranslations, sentenceTranslations] = locale
    ? await Promise.all([
        getContentTranslations("lesson", [lesson.id], locale),
        getContentTranslations("sentence", sentenceIds, locale),
      ])
    : [undefined, undefined];

  const lessonSentences = (sentences ?? []).map((sentence) =>
    toSentence(sentence, locale, sentenceTranslations),
  );
  const levelIndex = level?.index ?? 1;

  // Stories-only, isolated feature — see buildStoryVocabulary's doc
  // comment. Normal/conversation lessons are untouched by it (storyVocab
  // stays null); they instead get a derived recap vocabulary list — see the
  // matching comment in fetchLessons above. Curated vocabulary takes
  // priority when this lesson has authored target words — see
  // applyCuratedStoryVocabulary's own doc comment.
  const storyVocab =
    mode === "stories"
      ? (applyCuratedStoryVocabulary(lessonSentences, lesson.id) ??
        buildStoryVocabulary(lessonSentences, levelIndex, lesson.title))
      : null;
  const derivedVocabulary = storyVocab
    ? null
    : deriveStoryVocabulary(lessonSentences, levelIndex, lesson.title);

  const unit: Lesson = {
    id: lesson.id,
    mode: lesson.mode,
    level: levelIndex,
    order: lesson.order_index,
    title: lesson.title,
    titleAr: lesson.title_ar,
    isFree: lesson.is_free,
    illustrationUrl: lesson.illustration_url ?? undefined,
    description: lesson.description ?? undefined,
    descriptionAr: lesson.description_ar ?? undefined,
    voiceId: lesson.voice_id ?? undefined,
    sentences: storyVocab ? storyVocab.sentences : lessonSentences,
    ...(storyVocab
      ? { vocabulary: storyVocab.vocabulary }
      : derivedVocabulary && derivedVocabulary.length > 0
        ? { vocabulary: derivedVocabulary }
        : {}),
  };

  if (locale && lessonTranslations) {
    const supportTitle = resolveScalarField(
      lessonTranslations,
      lesson.id,
      "title",
      lesson.title_ar,
      locale,
    );
    warnIfMissing(supportTitle, "lesson", lesson.id, "title", locale);
    if (supportTitle !== undefined) unit.supportTitle = supportTitle;

    const supportDescription = resolveScalarField(
      lessonTranslations,
      lesson.id,
      "description",
      lesson.description_ar,
      locale,
    );
    if (supportDescription !== undefined) unit.supportDescription = supportDescription;
  }

  return unit;
}
