"use server";

import { after } from "next/server";

import { track } from "@/lib/analytics/track";
import { completeDailySession } from "@/lib/features/daily-session-queries";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { isSessionLength } from "@/lib/today/plan";
import { getCurrentUser } from "@/lib/supabase/auth";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Called once when a learner reaches the end of Today's session. Records the day in daily_sessions
 * (no XP — the finish screen promises none), which is what lights the day's dot on Today, and
 * reports one TODAY_SESSION_COMPLETED for the first session of the day. The numbers arrive as client
 * input, so they are re-validated and the call silently does nothing otherwise. Best-effort: it never
 * throws into the finish screen.
 */
export async function completeTodaySessionAction(input: {
  todayISO: string;
  length: number;
  reviewTotal: number;
  reviewClean: number;
}): Promise<{ ok: boolean }> {
  try {
    const { todayISO, length, reviewTotal, reviewClean } = input;
    if (
      !ISO_DATE.test(todayISO) ||
      !isSessionLength(length) ||
      !Number.isInteger(reviewTotal) ||
      !Number.isInteger(reviewClean) ||
      reviewTotal < 0 ||
      reviewTotal > 20 ||
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
            properties: { length, reviewTotal, reviewClean },
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
