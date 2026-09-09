import { cache } from "react";

import { unitsByMode } from "@/data/units";
import { lessonsByMode } from "@/data/lessons";
import {
  fetchLessonById,
  fetchLessonNav,
  fetchLessons,
  fetchLevelNames,
  fetchLevelPreviews,
  type LessonNavEntry,
} from "@/lib/supabase/queries/content";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LEARNING_MODES } from "@/lib/learning-modes";
import { withSupportTextFallback } from "@/lib/content-helpers";
import { deriveStoryVocabulary, withStoryVocabulary } from "@/lib/content/story-vocabulary";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { LearningMode, Lesson, LessonActivity, PreviewSentence } from "@/types/content";

export * from "@/lib/content-helpers";

/**
 * Completion-screen recap words for a lesson that has no hand-authored
 * `vocabulary` of its own — every normal/conversation lesson today, since
 * only stories mode (withStoryVocabulary) and a handful of hand-curated
 * conversation.ts entries populate that field. Reuses the same deterministic
 * word-ranking engine stories mode already relies on (see
 * src/lib/content/story-vocabulary.ts) rather than inventing a second
 * selection system — it already favors lesson-specific, title-relevant
 * words over generic ones, which is also what keeps picks from converging
 * on the same handful of common words across different lessons. A no-op
 * when the lesson already has curated vocabulary, or when its sentences
 * have no wordTranslations to rank (in which case the recap section simply
 * doesn't render, exactly as it already does for an empty list).
 */
function withLessonVocabulary(lesson: Lesson): Lesson {
  if (lesson.vocabulary && lesson.vocabulary.length > 0) return lesson;
  const vocabulary = deriveStoryVocabulary(lesson.sentences, lesson.level, lesson.title);
  return vocabulary.length > 0 ? { ...lesson, vocabulary } : lesson;
}

/**
 * The single place the app reads lesson content from. Falls back to the
 * local seed in src/data/lessons until a Supabase project is linked (see
 * supabase/README.md) — nothing else needs to change when that happens.
 * `locale` is optional and additive (see Sentence.supportText's doc
 * comment in types/content.ts) — every existing caller that omits it keeps
 * getting the exact same Lesson shape as before; the static seed path
 * never populates supportText/supportTitle regardless (the local dev seed
 * has no content_translations equivalent), matching how it already has no
 * admin-authored content beyond what's hardcoded there.
 *
 * Server-only: fetchLessonById reads the session-aware Supabase client to
 * resolve premium access, which pulls in next/headers — see
 * src/lib/content-helpers.ts for the pure helpers that are safe to import
 * from Client Components instead.
 */
export async function getLessons(mode: LearningMode, locale?: SupportLocale): Promise<Lesson[]> {
  if (isSupabaseConfigured()) return fetchLessons(mode, locale);
  if (mode === "stories") return lessonsByMode.stories.map(withStoryVocabulary);
  return lessonsByMode[mode].map(withLessonVocabulary);
}

/**
 * React-cache()'d: the lesson page's generateMetadata and its page component
 * both need this same lesson (see src/app/(app)/learn/[mode]/[lessonId]/page.tsx),
 * and Next.js runs both for the same request. Wrapping in cache() means two
 * calls with the same (mode, id, locale) within that one request share a
 * single fetch instead of issuing it twice — request-scoped only, exactly
 * like every other React cache() use in the App Router, so it never risks
 * serving one request's data to another.
 */
export const getLessonById = cache(async function getLessonById(
  mode: LearningMode,
  id: string,
  locale?: SupportLocale,
): Promise<Lesson | undefined> {
  if (isSupabaseConfigured()) return fetchLessonById(mode, id, locale);
  const lesson = lessonsByMode[mode].find((unit) => unit.id === id);
  if (!lesson) return undefined;
  return mode === "stories" ? withStoryVocabulary(lesson) : withLessonVocabulary(lesson);
});

/**
 * The id/level/order (and mode, unchanged per entry) of every published
 * lesson in a mode — everything findNextLesson needs and nothing else. See
 * fetchLessonNav's doc comment for why the lesson page uses this instead of
 * a full getLessons(mode) call just to find one adjacent lesson.
 */
export async function getLessonNav(mode: LearningMode): Promise<LessonNavEntry[]> {
  if (isSupabaseConfigured()) return fetchLessonNav(mode);
  return lessonsByMode[mode].map((lesson) => ({
    id: lesson.id,
    mode: lesson.mode,
    level: lesson.level,
    order: lesson.order,
  }));
}

/**
 * Admin-authored level names beyond the three static units in
 * src/data/units.ts (see src/data/units.ts's doc comment and
 * src/components/app/lesson-list-view.tsx's uncovered-levels rendering).
 * Local/no-Supabase mode has no live-created levels, so it's always empty
 * there — every level in that mode already has a static name.
 */
export async function getLevelNames(
  mode: LearningMode,
  locale?: SupportLocale,
): Promise<Record<number, { title: string; titleAr: string; supportTitle?: string }>> {
  if (isSupabaseConfigured()) return fetchLevelNames(mode, locale);
  return {};
}

/**
 * The 5-sentence "Start Simple" preview for each of the normal mode's three
 * levels (Beginner/Intermediate/Advanced) shown at the top of the /learn
 * homepage. Prefers the admin-editable Supabase copy (via /admin/levels);
 * falls back to the static previews in src/data/units.ts per level whenever
 * Supabase isn't configured, or an admin hasn't authored one for that level
 * yet (an empty array) — a level teaser is never silently blank.
 */
export async function getStartSimplePreviews(
  locale?: SupportLocale,
): Promise<Record<number, PreviewSentence[]>> {
  const staticPreviews: Record<number, PreviewSentence[]> = {};
  for (const unit of unitsByMode.normal) {
    staticPreviews[unit.level] = unit.previewSentences ?? [];
  }

  if (!isSupabaseConfigured()) return withSupportTextFallback(staticPreviews, locale);

  let dbPreviews: Record<number, PreviewSentence[]>;
  try {
    dbPreviews = await fetchLevelPreviews("normal", locale);
  } catch (error) {
    // Most likely the levels.preview_sentences column from this feature's
    // own migration (supabase/migrations/20250117000000_content_redesign.sql)
    // hasn't been applied to this project yet. That's a real, expected state
    // right after this code ships and before someone runs the migration —
    // the homepage should still render with the static fallback, not 500.
    console.error("[content] getStartSimplePreviews: fetchLevelPreviews failed", error);
    return withSupportTextFallback(staticPreviews, locale);
  }

  const merged: Record<number, PreviewSentence[]> = { ...staticPreviews };
  for (const [level, sentences] of Object.entries(dbPreviews)) {
    if (sentences.length > 0) merged[Number(level)] = sentences;
  }
  return withSupportTextFallback(merged, locale);
}

export async function getAllLessons(
  locale?: SupportLocale,
): Promise<Record<LearningMode, Lesson[]>> {
  const entries = await Promise.all(
    LEARNING_MODES.map(async (mode) => [mode, await getLessons(mode, locale)] as const),
  );
  return Object.fromEntries(entries) as Record<LearningMode, Lesson[]>;
}

/** The activities that make up a lesson. Only "typing" exists today; a future activity type would add another branch here. */
export function getActivities(lesson: Lesson): LessonActivity[] {
  return [{ type: "typing", sentences: lesson.sentences }];
}
