import { unstable_cache } from "next/cache";

import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";
import { distinctWords } from "@/lib/word-bank/readiness";

/**
 * Each published lesson's distinct words (stories and Daily lessons), for the line on a story card
 * that says how much of the story the learner has typed before (see readinessByLesson). It is the
 * same small read as the catalog's sentences (about 1,400 lesson sentences), made with the service
 * role and kept for an hour for everyone, never per learner; a page then counts in memory.
 *
 * Only words leave this module, as a set per lesson id: never a sentence, a translation or their
 * order.
 */

const PAGE = 1000;
/** Far beyond the catalog; the cap only keeps a bug from looping. */
const MAX_PAGES = 20;

async function readLessonWords(): Promise<Record<string, string[]>> {
  if (!isServiceRoleConfigured()) return {};
  const supabase = createServiceRoleClient();
  const lessons = await supabase.from("lessons").select("id").eq("status", "published");
  if (lessons.error) throw lessons.error;
  const published = new Set(lessons.data.map((row) => row.id));

  const sentences = new Map<string, string[]>();
  // A plain select stops silently at 1000 rows, so the table is read page by page.
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from("sentences")
      .select("lesson_id, en")
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;
    for (const row of data) {
      if (!published.has(row.lesson_id)) continue;
      const list = sentences.get(row.lesson_id);
      if (list) list.push(row.en);
      else sentences.set(row.lesson_id, [row.en]);
    }
    if (data.length < PAGE) break;
  }

  const index: Record<string, string[]> = {};
  for (const [lessonId, list] of sentences) index[lessonId] = distinctWords(list);
  return index;
}

/** A failed read throws, and unstable_cache does not keep a throw: the next page simply tries again. */
const cachedLessonWords = unstable_cache(readLessonWords, ["word-bank-lesson-words-v1"], {
  revalidate: 3600,
});

/** Every published lesson's words by lesson id, or none when they cannot be read (the cards then show no line, never an error). */
export async function loadLessonWords(): Promise<Record<string, string[]>> {
  try {
    return await cachedLessonWords();
  } catch (error) {
    console.error("[word-bank] reading the lessons' words failed", error);
    return {};
  }
}
