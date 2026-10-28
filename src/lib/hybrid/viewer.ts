import { cookies } from "next/headers";

import { getLessonSummaries } from "@/lib/content";
import { fetchPassageProgress, fetchPassageSummaries } from "@/lib/passages/queries";
import { fetchProgressCached } from "@/lib/progress/cached";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import { todayLocalISODate } from "@/lib/progress/streak";
import type { SupportLocale } from "@/lib/i18n/locales";

import { todayPicks } from "./picks";
import type { TodayPicks } from "./picks";

/** The picks, and how many Premium passages and stories the full plan opens (the catalog's own counts, for the copy). */
export interface ViewerTaste {
  picks: TodayPicks;
  premiumPassages: number;
  premiumStories: number;
}

/**
 * Today's taste for a signed-in free learner, read for a lock screen or a moment: the same picks
 * Today's loader makes (see hybrid/picks.ts), so a Premium item shows as open exactly where Today
 * opens it. Each list is read only when the caller needs it, and every read is cached or the learner's
 * own rows.
 */
export async function viewerTaste(input: {
  userId: string;
  locale: SupportLocale | null;
  withPassages: boolean;
  withStories: boolean;
}): Promise<ViewerTaste> {
  // The learner's own day, as Today counts it (their time zone is in a cookie, see TIMEZONE_COOKIE).
  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const [progress, storiesUnits, summaries, passageProgress] = await Promise.all([
    fetchProgressCached(todayISO),
    input.withStories ? getLessonSummaries("stories", input.locale ?? undefined) : [],
    input.withPassages ? fetchPassageSummaries() : [],
    input.withPassages ? fetchPassageProgress(input.userId) : [],
  ]);
  const picks = todayPicks({
    userId: input.userId,
    todayISO,
    isPremium: false,
    taste: true,
    startingLevel: progress?.startingLevel ?? null,
    passages: input.withPassages ? { summaries, progress: passageProgress } : undefined,
    storiesUnits,
    completedStoryIds: (progress?.completions ?? [])
      .filter((entry) => entry.mode === "stories")
      .map((entry) => entry.lessonId),
  });
  return {
    picks,
    premiumPassages: summaries.filter((passage) => !passage.isFree).length,
    premiumStories: storiesUnits.filter((unit) => !unit.isFree).length,
  };
}
