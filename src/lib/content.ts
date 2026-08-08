import { lessonsByMode } from "@/data/lessons";
import { unitsByMode } from "@/data/units";
import { fetchLessonById, fetchLessons } from "@/lib/supabase/queries/content";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LEARNING_MODES, modeMeta } from "@/lib/learning-modes";
import type {
  Course,
  LearningMode,
  Lesson,
  LessonActivity,
  LessonUnit,
  Unit,
} from "@/types/content";

/**
 * The single place the app reads lesson content from. Falls back to the
 * local seed in src/data/lessons until a Supabase project is linked (see
 * supabase/README.md) — nothing else needs to change when that happens.
 */
export async function getLessons(mode: LearningMode): Promise<Lesson[]> {
  if (isSupabaseConfigured()) return fetchLessons(mode);
  return lessonsByMode[mode];
}

export async function getLessonById(mode: LearningMode, id: string): Promise<Lesson | undefined> {
  if (isSupabaseConfigured()) return fetchLessonById(mode, id);
  return lessonsByMode[mode].find((unit) => unit.id === id);
}

export async function getAllLessons(): Promise<Record<LearningMode, Lesson[]>> {
  const entries = await Promise.all(
    LEARNING_MODES.map(async (mode) => [mode, await getLessons(mode)] as const),
  );
  return Object.fromEntries(entries) as Record<LearningMode, Lesson[]>;
}

// --- Curriculum composition: Course > Unit, built from static metadata. ---
// Content (lessons/sentences) stays fetchable per above; units and courses
// are lightweight descriptive metadata, not something worth a round trip.

export function getUnits(mode: LearningMode): Unit[] {
  return unitsByMode[mode];
}

export function getCourse(mode: LearningMode): Course {
  const meta = modeMeta[mode];
  return { id: mode, title: meta.title, description: meta.description, units: getUnits(mode) };
}

/** The activities that make up a lesson. Only "typing" exists today; a future activity type would add another branch here. */
export function getActivities(lesson: Lesson): LessonActivity[] {
  return [{ type: "typing", sentences: lesson.sentences }];
}

// --- Pure helpers that derive views over an already-fetched lesson list. ---

export function filterFree(units: LessonUnit[]): LessonUnit[] {
  return units.filter((unit) => unit.isFree);
}

export function sentenceCount(units: LessonUnit[]): number {
  return units.reduce((total, unit) => total + unit.sentences.length, 0);
}

export function getLevels(units: LessonUnit[]): number[] {
  const levels = new Set(units.map((unit) => unit.level));
  return Array.from(levels).sort((a, b) => a - b);
}

export function getLessonsByLevel(units: LessonUnit[], level: number): LessonUnit[] {
  return units.filter((unit) => unit.level === level);
}

export function findNextLesson(units: Lesson[], currentId: string): Lesson | undefined {
  const sorted = [...units].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((unit) => unit.id === currentId);
  if (index === -1) return undefined;
  return sorted[index + 1];
}
