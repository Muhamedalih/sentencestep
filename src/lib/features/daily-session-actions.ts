"use server";

import { after } from "next/server";

import type { ReviewWord } from "@/components/learning/word-review-session";
import { awardEventBadge } from "@/lib/features/badge-service";
import { completeDailySession } from "@/lib/features/daily-session-queries";
import { buildDailySessionWords } from "@/lib/features/daily-session-service";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { recordQuestEventsAndBadges } from "@/lib/features/quest-service";
import { getLocale } from "@/lib/i18n/get-locale";
import { createClient } from "@/lib/supabase/server";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

export interface DailySessionSummary {
  /** Words ready to review (an estimate — see countDailySessionCandidates). */
  ready: number;
  minutes: number;
  xpReward: number;
  completedToday: boolean;
}

/** The session's words, for /learn/session. [] when the feature isn't open, nothing is due, or anything fails. */
export async function fetchDailySessionWordsAction(): Promise<ReviewWord[]> {
  try {
    const features = await getEffectiveFeatures();
    if (!features.dailySession.enabled) return [];
    const userId = await getSessionUserId();
    if (!userId) return [];
    return await buildDailySessionWords(userId, features, await getLocale());
  } catch (error) {
    console.error("[daily-session] fetchDailySessionWordsAction failed", error);
    return [];
  }
}

/**
 * Called once the learner reaches the end of the session. Pays the XP reward
 * at most once per local day (the database decides — see
 * complete_daily_session), and only then credits the "finish the session"
 * quest and the first-session badge. Best-effort: resolves with what it did
 * and never throws into the completion screen.
 */
export async function completeDailySessionAction(
  todayISO: string,
  reviewedCount: number,
): Promise<{ first: boolean; xp: number }> {
  const none = { first: false, xp: 0 };
  if (!ISO_DATE.test(todayISO) || !Number.isInteger(reviewedCount) || reviewedCount < 1) {
    return none;
  }
  try {
    const features = await getEffectiveFeatures();
    if (!features.dailySession.enabled) return none;
    const userId = await getSessionUserId();
    if (!userId) return none;

    const xp = features.dailySession.xpReward;
    const first = await completeDailySession(todayISO, xp);
    if (first) {
      after(async () => {
        await recordQuestEventsAndBadges(userId, [{ type: "dailySession", amount: 1 }], todayISO);
        await awardEventBadge("firstDailySession");
      });
    }
    return { first, xp: first ? xp : 0 };
  } catch (error) {
    console.error("[daily-session] completeDailySessionAction failed", error);
    return none;
  }
}
