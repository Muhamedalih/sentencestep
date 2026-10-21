import { getLessonSummaries } from "@/lib/content";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getWordGroupSummaries } from "@/lib/word-lists";

import { levelProgress } from "./plan";

/**
 * What the Profile's level card needs (admin preview): the learner's current
 * level and their progress on the three tracks inside it. The lesson lists are
 * the light per-mode summaries (no sentence bodies), the word groups are the
 * same call the Word Lists page makes, and the completed words are passed in
 * because the Profile page already reads them. A failure reads as "no card",
 * never as an error page.
 */
export async function loadLevelProgress(args: {
  locale?: SupportLocale;
  completedWordIds: readonly string[];
  /** The "Chosen level shapes the path" permission (see getCurrentLevel). */
  floor?: boolean;
}): Promise<ReturnType<typeof levelProgress> | null> {
  try {
    const [units, storiesUnits, groups, progress] = await Promise.all([
      getLessonSummaries("normal", args.locale),
      getLessonSummaries("stories", args.locale),
      getWordGroupSummaries(args.locale),
      fetchProgressCached(todayLocalISODate()),
    ]);
    const idsOf = (mode: "normal" | "stories") =>
      progress.completions.filter((entry) => entry.mode === mode).map((entry) => entry.lessonId);
    return levelProgress({
      units,
      storiesUnits,
      groups,
      lessonIds: idsOf("normal"),
      storyIds: idsOf("stories"),
      completedWordIds: new Set(args.completedWordIds),
      startingLevel: progress.startingLevel,
      floor: args.floor,
      isPremiumUser: true,
    });
  } catch (error) {
    console.error("[home-plan] loadLevelProgress failed", error);
    return null;
  }
}
