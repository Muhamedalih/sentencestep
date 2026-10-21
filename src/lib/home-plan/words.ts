import { localISODateInTimeZone } from "@/lib/features/learner-date";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchWordProgressDated } from "@/lib/supabase/queries/word-progress";
import { getWordGroupById, getWordGroupSummaries } from "@/lib/word-lists";

import { WORDS_PER_DAY, pickNextWordBlock } from "./plan";

/** What Home's plan needs from Word Lists, read once on the server. */
export interface HomePlanWords {
  /** Today's block of new words, or null once every word is done. */
  next: {
    groupId: string;
    title: string;
    supportTitle: string;
    from: number;
    to: number;
    total: number;
    words: string[];
    started: boolean;
  } | null;
  /** Words completed for the first time on the learner's calendar day. */
  learnedToday: number;
}

/**
 * Admin preview only. Two reads Home did not make before — the group summaries
 * (the same call the Word Lists page makes) and the learner's word_progress
 * rows — plus one group for the five-word preview. A failure reads as "no
 * plan words", never as an error page.
 */
export async function loadHomePlanWords(args: {
  userId: string;
  locale?: SupportLocale;
  timeZone?: string | null;
  isPremiumUser: boolean;
  startingLevel: number | null;
  /** The "Chosen level shapes the path" permission (see getCurrentLevel). */
  floor?: boolean;
}): Promise<HomePlanWords | null> {
  try {
    const [groups, rows] = await Promise.all([
      getWordGroupSummaries(args.locale),
      fetchWordProgressDated(args.userId),
    ]);
    const completed = new Set(rows.map((row) => row.wordId));
    const zone = args.timeZone ?? "UTC";
    const today = localISODateInTimeZone(zone);
    const learnedToday = rows.filter(
      (row) => localISODateInTimeZone(zone, new Date(row.firstAt)) === today,
    ).length;

    const block = pickNextWordBlock(groups, completed, {
      isPremiumUser: args.isPremiumUser,
      startingLevel: args.startingLevel,
      floor: args.floor,
    });
    const group = block ? await getWordGroupById(block.group.id, args.locale) : undefined;
    const next =
      block && group
        ? {
            groupId: block.group.id,
            title: block.group.title,
            supportTitle:
              block.group.supportTitle ??
              (args.locale === "ar" ? block.group.titleAr : block.group.title),
            from: block.from,
            to: block.to,
            total: block.group.wordIds.length,
            words: group.words
              .slice(block.blockIndex * WORDS_PER_DAY, (block.blockIndex + 1) * WORDS_PER_DAY)
              .map((word) => word.targetWord),
            started: block.started,
          }
        : null;

    return { next, learnedToday };
  } catch (error) {
    console.error("[home-plan] loadHomePlanWords failed", error);
    return null;
  }
}
