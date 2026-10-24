import { tallySentenceStats } from "@/lib/content-helpers";
import { honestLine, honestNumbers } from "@/lib/progress/honest-numbers";
import type { HonestLine, LessonTotals } from "@/lib/progress/honest-numbers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * The one honest line about a learner's progress that the premium-ending reminder may carry (see
 * premiumExpiryEmail): sentences written and days practised, counted the way Home and the lock card
 * count them (honestNumbers). The reminder runs with no learner session, so this reads with the
 * service role, for the few learners due that day, in three reads in all.
 */

export interface ProgressRow {
  user_id: string;
  lesson_id: string;
  mode: string;
}

export interface SentenceRow {
  lesson_id: string;
  en: string;
}

export interface ActivityRow {
  user_id: string;
  day: string;
  kind: string;
}

/** The line for each learner who has one; a learner with too little to say is left out of the map. */
export function expiryProgressLines(input: {
  userIds: readonly string[];
  progress: readonly ProgressRow[];
  sentences: readonly SentenceRow[];
  activity: readonly ActivityRow[];
}): Map<string, HonestLine> {
  const totals = tallySentenceStats(input.sentences);
  const lines = new Map<string, HonestLine>();

  for (const userId of input.userIds) {
    const completions = input.progress
      .filter((row) => row.user_id === userId)
      .map((row) => ({ mode: row.mode, lessonId: row.lesson_id }));
    const lessonStats: Record<string, LessonTotals> = {};
    for (const completion of completions) {
      const stat = totals.get(completion.lessonId);
      if (stat) lessonStats[`${completion.mode}:${completion.lessonId}`] = stat;
    }
    const numbers = honestNumbers({
      completions,
      lessonStats,
      wpm: [],
      wordStrengths: [],
      activity: input.activity.filter((row) => row.user_id === userId),
    });
    const line = honestLine(numbers);
    if (line) lines.set(userId, line);
  }
  return lines;
}

const LESSON_CHUNK = 60;

/**
 * Reads what expiryProgressLines needs for these learners. Any failure gives an empty map: the
 * reminder then goes out exactly as it always did, without the line.
 */
export async function loadExpiryProgress(
  userIds: readonly string[],
): Promise<Map<string, HonestLine>> {
  if (userIds.length === 0) return new Map();
  try {
    const supabase = createServiceRoleClient();
    const [progressResult, activityResult] = await Promise.all([
      supabase
        .from("user_progress")
        .select("user_id, lesson_id, mode")
        .in("user_id", [...userIds])
        .not("completed_at", "is", null),
      supabase
        .from("activity_days")
        .select("user_id, day, kind")
        .in("user_id", [...userIds])
        .eq("kind", "active"),
    ]);
    if (progressResult.error) throw progressResult.error;
    if (activityResult.error) throw activityResult.error;

    const progress = progressResult.data ?? [];
    const lessonIds = [...new Set(progress.map((row) => row.lesson_id))];
    const sentences: SentenceRow[] = [];
    for (let at = 0; at < lessonIds.length; at += LESSON_CHUNK) {
      const { data, error } = await supabase
        .from("sentences")
        .select("lesson_id, en")
        .in("lesson_id", lessonIds.slice(at, at + LESSON_CHUNK));
      if (error) throw error;
      sentences.push(...(data ?? []));
    }
    return expiryProgressLines({
      userIds,
      progress,
      sentences,
      activity: activityResult.data ?? [],
    });
  } catch (error) {
    console.error("[expiry-progress] could not read the learners' progress", error);
    return new Map();
  }
}
