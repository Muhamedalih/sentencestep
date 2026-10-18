import { createPublicClient } from "@/lib/supabase/public-client";
import { createClient } from "@/lib/supabase/server";
import { fetchLessonSentenceStats } from "@/lib/supabase/queries/content";

/**
 * The few real figures the screen after the last free lesson shows: how much the
 * learner wrote in their free lessons and on how many days they practiced, and the
 * name of the curriculum unit the lesson belongs to. Every part degrades on its own
 * (a figure that can't be read is simply left out), so this never stops that screen
 * from showing.
 */
export interface FreePathSummary {
  /** The curriculum unit's English name (e.g. "Everyday Mishap → Resolution"), when the lesson belongs to one. */
  unitTitle: string | null;
  sentences: number;
  words: number;
  /** Distinct days the learner practiced; 0 when it is not recorded or can't be read. */
  days: number;
}

async function fetchUnitTitle(lessonId: string): Promise<string | null> {
  const supabase = createPublicClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("unit_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (error || !lesson?.unit_id) return null;
  const { data: unit } = await supabase
    .from("units")
    .select("title")
    .eq("id", lesson.unit_id)
    .maybeSingle();
  return unit?.title ?? null;
}

async function fetchActiveDayCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("activity_days")
    .select("day", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "active");
  if (error) return 0;
  return count ?? 0;
}

export async function getFreePathSummary({
  userId,
  lessonId,
  finishedIds,
}: {
  userId: string;
  /** The Premium lesson the learner opened: its unit names the screen. */
  lessonId: string;
  /** The free lessons they finished — only those are counted. */
  finishedIds: string[];
}): Promise<FreePathSummary> {
  const [unitTitle, stats, days] = await Promise.all([
    fetchUnitTitle(lessonId).catch(() => null),
    fetchLessonSentenceStats(finishedIds),
    fetchActiveDayCount(userId).catch(() => 0),
  ]);
  let sentences = 0;
  let words = 0;
  for (const counts of stats.values()) {
    sentences += counts.sentences;
    words += counts.words;
  }
  return { unitTitle, sentences, words, days };
}
