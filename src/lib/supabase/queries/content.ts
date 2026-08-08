import { createPublicClient } from "@/lib/supabase/public-client";
import type { Database } from "@/types/database";
import type { LearningMode, LessonUnit, Sentence } from "@/types/content";

/**
 * Supabase-backed content reads, matching the shape of the local seed in
 * src/data/lessons. Only called once isSupabaseConfigured() is true — see
 * src/lib/content.ts, the single place the rest of the app reads lessons
 * from.
 */

type SentenceRow = Database["public"]["Tables"]["sentences"]["Row"];

function toSentence(row: SentenceRow): Sentence {
  return {
    id: row.id,
    en: row.en,
    ar: row.ar,
    ...(row.speaker ? { speaker: row.speaker } : {}),
  };
}

export async function fetchLessons(mode: LearningMode): Promise<LessonUnit[]> {
  const supabase = createPublicClient();

  const [{ data: lessons, error: lessonsError }, { data: levels, error: levelsError }] =
    await Promise.all([
      supabase.from("lessons").select("*").eq("mode", mode).order("order_index"),
      supabase.from("levels").select("*").eq("mode", mode),
    ]);

  if (lessonsError) throw lessonsError;
  if (levelsError) throw levelsError;
  if (!lessons || lessons.length === 0) return [];

  const levelIndexById = new Map((levels ?? []).map((level) => [level.id, level.index]));

  const { data: sentences, error: sentencesError } = await supabase
    .from("sentences")
    .select("*")
    .in(
      "lesson_id",
      lessons.map((lesson) => lesson.id),
    )
    .order("order_index");

  if (sentencesError) throw sentencesError;

  return lessons.map((lesson) => ({
    id: lesson.id,
    mode: lesson.mode,
    level: levelIndexById.get(lesson.level_id) ?? 1,
    order: lesson.order_index,
    title: lesson.title,
    titleAr: lesson.title_ar,
    isFree: lesson.is_free,
    sentences: (sentences ?? [])
      .filter((sentence) => sentence.lesson_id === lesson.id)
      .map(toSentence),
  }));
}

export async function fetchLessonById(
  mode: LearningMode,
  id: string,
): Promise<LessonUnit | undefined> {
  const supabase = createPublicClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("mode", mode)
    .eq("id", id)
    .maybeSingle();

  if (lessonError) throw lessonError;
  if (!lesson) return undefined;

  const [{ data: level, error: levelError }, { data: sentences, error: sentencesError }] =
    await Promise.all([
      supabase.from("levels").select("*").eq("id", lesson.level_id).maybeSingle(),
      supabase.from("sentences").select("*").eq("lesson_id", lesson.id).order("order_index"),
    ]);

  if (levelError) throw levelError;
  if (sentencesError) throw sentencesError;

  return {
    id: lesson.id,
    mode: lesson.mode,
    level: level?.index ?? 1,
    order: lesson.order_index,
    title: lesson.title,
    titleAr: lesson.title_ar,
    isFree: lesson.is_free,
    sentences: (sentences ?? []).map(toSentence),
  };
}
