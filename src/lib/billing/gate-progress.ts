import { getAccessState } from "@/lib/billing/access";
import { fetchActivityRange } from "@/lib/features/activity-queries";
import { gateProgress, honestNumbers } from "@/lib/progress/honest-numbers";
import type { GateProgress, LessonTotals } from "@/lib/progress/honest-numbers";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchLessonSentenceStats } from "@/lib/supabase/queries/content";
import { fetchUserProgress } from "@/lib/supabase/queries/progress";

/**
 * What the lock card says about the signed-in learner (see PremiumGate): the sentences they have
 * written and the days they have practised, counted the way Home counts them (honestNumbers). Three
 * small reads of their own rows, started together with the lock's other reads; nothing is shown for
 * a visitor, for a learner who has barely started, or when any read fails (the card then looks as it
 * always did).
 */
export async function getGateProgress(): Promise<GateProgress | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const [rows, access, activity] = await Promise.all([
      fetchUserProgress(user.id),
      getAccessState(),
      // History starts when the activity log was switched on; a missing table just means no days.
      fetchActivityRange(user.id, "2000-01-01", "2999-12-31").catch(() => []),
    ]);
    const completed = rows.filter((row) => row.completed_at);
    const stats = await fetchLessonSentenceStats([
      ...new Set(completed.map((row) => row.lesson_id)),
    ]);
    const lessonStats: Record<string, LessonTotals> = {};
    for (const row of completed) {
      const counts = stats.get(row.lesson_id);
      if (counts) lessonStats[`${row.mode}:${row.lesson_id}`] = counts;
    }
    const numbers = honestNumbers({
      completions: completed.map((row) => ({ mode: row.mode, lessonId: row.lesson_id })),
      lessonStats,
      wpm: [],
      wordStrengths: [],
      activity,
    });
    // "Your review stays free" is only true for an account that never had a paid period.
    const neverPaid = access.status === "free" && access.expiresAt === null;
    return gateProgress(numbers, neverPaid);
  } catch (error) {
    console.error("[gate-progress] could not read the learner's progress", error);
    return null;
  }
}
