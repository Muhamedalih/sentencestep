import { createPublicClient } from "@/lib/supabase/public-client";
import { createClient } from "@/lib/supabase/server";
import { isLearnerVisibleStatus } from "@/lib/content-helpers";
import {
  getContentTranslations,
  resolveScalarField,
  resolveWordArrayField,
  warnIfMissing,
} from "@/lib/i18n/content-translations";
import { buildStoryVocabulary, deriveStoryVocabulary } from "@/lib/content/story-vocabulary";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { Database } from "@/types/database";
import type { Lesson, LearningMode, PreviewSentence, Sentence } from "@/types/content";

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
export async function fetchLevelNames(
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
 * Admin-authored "Start Simple" preview sentences (via /admin/levels), keyed
 * by level index — the handful of standalone example sentences shown on the
 * homepage before any lesson, not tied to a lesson/activity. Falls back to
 * an empty array per level when nothing's been authored yet; the caller
 * (src/lib/content.ts's getStartSimplePreviews) is responsible for falling
 * back further to the static src/data/units.ts previews in that case.
 */
export async function fetchLevelPreviews(
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
export async function fetchLessons(mode: LearningMode, locale?: SupportLocale): Promise<Lesson[]> {
  const supabase = await createClient();

  // A single round trip: sentences are embedded on the lessons row via the
  // sentences.lesson_id -> lessons.id foreign key (see
  // supabase/migrations/20250101000000_init_schema.sql), so PostgREST can
  // return both in one request instead of the two sequential round trips
  // this used to take (lessons+levels, then a dependent sentences query
  // keyed off the first result's lesson ids). levels has no relationship to
  // lessons.mode, so it stays a separate query, but it no longer needs to
  // wait on the first result — both queries below now fire together. This
  // goes through the same session-aware client as before, so the sentences
  // RLS policy (which checks auth.uid() per lesson) is evaluated identically
  // whether the row is reached via a direct select or an embed — see this
  // function's own doc comment above for why that matters for premium
  // content.
  const [{ data: lessonRows, error: lessonsError }, { data: levels, error: levelsError }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("*, sentences(*)")
        .eq("mode", mode)
        .eq("status", "published")
        .order("order_index")
        .order("order_index", { referencedTable: "sentences" }),
      supabase.from("levels").select("*").eq("mode", mode),
    ]);

  if (lessonsError) throw lessonsError;
  if (levelsError) throw levelsError;
  // Defensive double-check (see isLearnerVisibleStatus's doc comment) — the
  // query above is the real filter, this just means a regression there
  // can't silently leak draft/archived lessons to learners.
  const lessonRowsWithSentences = (lessonRows ?? []) as unknown as LessonRowWithSentences[];
  const lessons = lessonRowsWithSentences.filter((lesson) => isLearnerVisibleStatus(lesson.status));
  if (lessons.length === 0) return [];

  const levelIndexById = new Map((levels ?? []).map((level) => [level.id, level.index]));

  const sentences: SentenceRow[] = lessons.flatMap(
    (lesson) => (lesson.sentences ?? []) as SentenceRow[],
  );

  const lessonIds = lessons.map((lesson) => lesson.id);
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
    const storyVocab =
      mode === "stories" ? buildStoryVocabulary(lessonSentences, level, lesson.title) : null;
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

/** The subset of a lesson findNextLesson actually needs to pick the next one and build its `/learn/{mode}/{id}` link — see fetchLessonNav's doc comment. */
export interface LessonNavEntry {
  id: string;
  mode: LearningMode;
  level: number;
  order: number;
}

type LessonNavRow = Pick<LessonRow, "id" | "mode" | "order_index" | "status"> & {
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
export async function fetchLessonNav(mode: LearningMode): Promise<LessonNavEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("id, mode, order_index, status, levels(index)")
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
    }));
}

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
  // matching comment in fetchLessons above.
  const storyVocab =
    mode === "stories" ? buildStoryVocabulary(lessonSentences, levelIndex, lesson.title) : null;
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
