"use server";

import { after } from "next/server";

import { track } from "@/lib/analytics/track";
import { completeDailySession } from "@/lib/features/daily-session-queries";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { fetchActiveMistakeCount, fetchDueReviewCountBy } from "@/lib/supabase/queries/mistakes";
import { fetchDueVocabularyRecallCount } from "@/lib/supabase/queries/vocabulary-recall";
import { getCurrentUser } from "@/lib/supabase/auth";
import { WORDS_PER_ROUND } from "@/lib/today/plan";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_HORIZON_MS = 72 * 60 * 60 * 1000;

/**
 * Called once when a learner reaches the finish screen of Today's session. Records the day in
 * daily_sessions (no XP — the finish screen promises none), which is what lights the day's dot on
 * Today, and reports one TODAY_SESSION_COMPLETED for the first session of the day. The numbers
 * arrive as client input, so they are re-validated and the call silently does nothing otherwise.
 * Best-effort: it never throws into the finish screen.
 */
export async function completeTodaySessionAction(input: {
  todayISO: string;
  reviewTotal: number;
  reviewClean: number;
}): Promise<{ ok: boolean }> {
  try {
    const { todayISO, reviewTotal, reviewClean } = input;
    if (
      !ISO_DATE.test(todayISO) ||
      !Number.isInteger(reviewTotal) ||
      !Number.isInteger(reviewClean) ||
      reviewTotal < 0 ||
      reviewTotal > 60 ||
      reviewClean < 0 ||
      reviewClean > reviewTotal
    ) {
      return { ok: false };
    }
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.todaySession || !user) return { ok: false };

    const first = await completeDailySession(todayISO, 0);
    if (first) {
      after(() =>
        track(
          {
            name: "TODAY_SESSION_COMPLETED",
            category: "ENGAGEMENT",
            properties: { reviewTotal, reviewClean },
          },
          user.id,
        ),
      );
    }
    return { ok: true };
  } catch (error) {
    console.error("[today] completeTodaySessionAction failed", error);
    return { ok: false };
  }
}

/**
 * How many words come back tomorrow, for the finish screen's "tomorrow" card: the learner's active
 * mistakes, the corrected words whose review falls due by the end of tomorrow, and the lesson
 * words due, never more than one round of the words step holds. `tomorrowEndISO` is the end of
 * tomorrow in the learner's own time zone, as an instant. 0 for anything that does not check out
 * or fails.
 */
export async function fetchTodayTomorrowAction(
  tomorrowEndISO: string,
): Promise<{ reviewWords: number }> {
  try {
    const until = new Date(tomorrowEndISO);
    const horizon = until.getTime() - Date.now();
    if (!Number.isFinite(horizon) || horizon <= 0 || horizon > MAX_HORIZON_MS) {
      return { reviewWords: 0 };
    }
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.todaySession || !user) return { reviewWords: 0 };
    const [active, due, recall] = await Promise.all([
      fetchActiveMistakeCount(user.id),
      fetchDueReviewCountBy(user.id, until),
      fetchDueVocabularyRecallCount(user.id),
    ]);
    return { reviewWords: Math.min(WORDS_PER_ROUND, active + due + recall) };
  } catch (error) {
    console.error("[today] fetchTodayTomorrowAction failed", error);
    return { reviewWords: 0 };
  }
}
