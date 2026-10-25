import { estimatePassageMinutes } from "@/lib/passages/progress";
import { estimateStoryMinutes, WORDS_MINUTES, WORDS_PER_ROUND } from "@/lib/today/plan";

/**
 * "Your first 30 days": what thirty of Today's sessions make available, said in units and counts
 * only (never a level, a score or a promise). A session is one passage to listen to, one story to
 * write and five words (src/lib/today/plan.ts), so the totals are plain multiplication; the one
 * estimate is the sentences the learner writes, taken from the typical story.
 *
 * TYPICAL_* are the medians of the published library, measured on 2026-10-25: 132 stories (median
 * 8 sentences, 57 words), 53 passages (median 28 lines in 4 parts) and the learners' median typing
 * speed (19 words a minute, src/lib/progress/honest-numbers.ts). Re-measure them if the library
 * changes shape; the card only ever says "about".
 */
export const PLAN_DAYS = 30;

export const TYPICAL_STORY_SENTENCES = 8;
export const TYPICAL_STORY_WORDS = 57;
export const TYPICAL_PASSAGE_LINES = 28;
export const TYPICAL_PASSAGE_QUESTIONS = 4;
export const TYPICAL_WPM = 19;

export interface ThirtyDayPlan {
  days: number;
  passages: number;
  stories: number;
  words: number;
  /** Sentences the learner types over the period: the typical story's, once a day. */
  sentences: number;
  /** One session, in whole minutes, from the same estimates Today shows next to each task. */
  minutesPerSession: number;
}

export function thirtyDayPlan(days: number = PLAN_DAYS): ThirtyDayPlan {
  const passage = estimatePassageMinutes(TYPICAL_PASSAGE_LINES, TYPICAL_PASSAGE_QUESTIONS);
  const story = estimateStoryMinutes({
    words: TYPICAL_STORY_WORDS,
    sentences: TYPICAL_STORY_SENTENCES,
    wpm: TYPICAL_WPM,
  });
  return {
    days,
    passages: days,
    stories: days,
    words: days * WORDS_PER_ROUND,
    sentences: days * TYPICAL_STORY_SENTENCES,
    minutesPerSession: passage + story + WORDS_MINUTES,
  };
}

/**
 * Whether the payment just confirmed is the learner's first: no other order of theirs was ever
 * fulfilled. Someone adding days to a subscription they already use must not be told "your first
 * 30 days". Anything unreadable counts as not first, so the card is left out rather than wrong.
 */
export function isFirstPayment(
  orders: ReadonlyArray<{ reference_id: string; status: string }> | null | undefined,
  thisReference: string,
): boolean {
  if (!orders) return false;
  return !orders.some(
    (order) => order.reference_id !== thisReference && order.status === "fulfilled",
  );
}
