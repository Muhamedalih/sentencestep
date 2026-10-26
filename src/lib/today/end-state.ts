import type { PassageSummary } from "@/lib/passages/types";
import type { LessonUnit } from "@/types/content";

/**
 * What Today shows once the learner has nothing left to open: every passage and story open to them
 * is finished, and none was finished today (that day is still a normal, finished one). Pure — the
 * loader (load.ts) reads the lists and the learner's progress, this only decides.
 */
export interface TodayEndInfo {
  /** A Premium learner has finished the whole library; a free one, the starter passages and stories. */
  premium: boolean;
  /** How many passages and stories were open to them, all of them finished. */
  passages: number;
  stories: number;
}

/**
 * The end state, or null while Today still has something to show. It only ever says "finished" for
 * a catalog that was really read: an empty list (a failed read is an empty list) is never taken for
 * "everything is done", and a section that is switched off is not a reason to say so either.
 */
export function todayEndInfo(input: {
  isPremium: boolean;
  passagesEnabled: boolean;
  passages: readonly Pick<PassageSummary, "isFree">[];
  stories: readonly Pick<LessonUnit, "isFree">[];
  /** The passage and the story Today would open next; null for none left. */
  nextPassage: unknown;
  nextStory: unknown;
  /** The day has a passage or a story to its name: one open next, or one finished today. */
  hasLessonsToday: boolean;
}): TodayEndInfo | null {
  if (input.hasLessonsToday || input.nextPassage || input.nextStory) return null;
  if (!input.passagesEnabled) return null;
  const open = <T extends { isFree: boolean }>(items: readonly T[]) =>
    items.filter((item) => input.isPremium || item.isFree).length;
  const passages = open(input.passages);
  const stories = open(input.stories);
  if (passages === 0 || stories === 0) return null;
  return { premium: input.isPremium, passages, stories };
}

/** Whether the learner finished a story or a passage on this calendar day (their own: `dayOf` maps an instant to it). */
export function finishedStoryOrPassageToday(input: {
  completions: readonly { mode: string; completedAt: string }[];
  passageProgress: readonly { completedAt: string | null }[];
  todayISO: string;
  dayOf: (iso: string) => string;
}): boolean {
  const { todayISO, dayOf } = input;
  return (
    input.completions.some(
      (entry) => entry.mode === "stories" && dayOf(entry.completedAt) === todayISO,
    ) ||
    input.passageProgress.some(
      (entry) => entry.completedAt !== null && dayOf(entry.completedAt) === todayISO,
    )
  );
}
