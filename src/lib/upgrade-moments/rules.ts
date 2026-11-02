/**
 * The upgrade cards at moments of progress (the "upgradeMoments" permission): the look of the lock
 * screen, shown over the page at three moments of satisfaction for a free learner. Pure: the server
 * reads the facts (the account's age, an open order, the subscription, what was shown and closed, the
 * streak, the day's stories) and this decides, so the rules can be read and tested in one place.
 *
 * tasks: the day's three tasks are done. streak3: the third day in a row. story: a story finished
 * outside the day's tasks, which is the learner's second story of the day or later (the first one is
 * what the story task asks for). At most one card a day, in the order the caller lists them.
 */

export const UPGRADE_MOMENTS = ["tasks", "streak3", "story"] as const;

export type UpgradeMoment = (typeof UPGRADE_MOMENTS)[number];

export function isUpgradeMoment(value: unknown): value is UpgradeMoment {
  return typeof value === "string" && (UPGRADE_MOMENTS as readonly string[]).includes(value);
}

const DAY_MS = 86_400_000;

/** A brand-new account does not see a card in its first day. */
export const NEW_ACCOUNT_MS = DAY_MS;

/** A card that was closed keeps all three away for this long. */
export const DISMISS_PAUSE_MS = 3 * DAY_MS;

/** How far back the server looks at what was shown and closed. */
export const HISTORY_MS = 7 * DAY_MS;

export type MomentBlock =
  "new-account" | "subscriber" | "open-order" | "shown-today" | "dismissed-lately";

/**
 * Why no card may be shown now, or null when one may be. An account whose creation time is not known
 * is treated as new: a card is never shown on a guess.
 */
export function momentBlock(input: {
  now: number;
  accountCreatedAt: number | null;
  isSubscriber: boolean;
  hasOpenOrder: boolean;
  shownToday: boolean;
  /** The instant (epoch ms) of the learner's latest close of a card, or null. */
  lastDismissedAt: number | null;
}): MomentBlock | null {
  if (input.accountCreatedAt === null || input.now - input.accountCreatedAt < NEW_ACCOUNT_MS) {
    return "new-account";
  }
  if (input.isSubscriber) return "subscriber";
  if (input.hasOpenOrder) return "open-order";
  if (input.shownToday) return "shown-today";
  if (input.lastDismissedAt !== null && input.now - input.lastDismissedAt < DISMISS_PAUSE_MS) {
    return "dismissed-lately";
  }
  return null;
}

export interface MomentFacts {
  /** The learner's current streak, in days. */
  streak: number;
  /** How many stories the learner has finished today, this one included. */
  storiesToday: number;
}

/** Whether one moment's own condition holds (the caller already knows the day's tasks are done for "tasks"). */
export function momentApplies(moment: UpgradeMoment, facts: MomentFacts): boolean {
  switch (moment) {
    case "tasks":
      return true;
    case "streak3":
      return facts.streak === 3;
    case "story":
      return facts.storiesToday >= 2;
  }
}

/** The first of the listed moments whose condition holds, or null. */
export function pickMoment(
  candidates: readonly UpgradeMoment[],
  facts: MomentFacts,
): UpgradeMoment | null {
  return candidates.find((moment) => momentApplies(moment, facts)) ?? null;
}

interface CompletionLike {
  mode: string;
  completedAt: string;
}

/** What the learner finished in the last seven days: lessons of any kind but stories, and stories. */
export function weekFigures(
  completions: readonly CompletionLike[],
  now: number,
): { lessons: number; stories: number } {
  let lessons = 0;
  let stories = 0;
  for (const entry of completions) {
    const at = Date.parse(entry.completedAt);
    if (!Number.isFinite(at) || now - at > 7 * DAY_MS || at > now + DAY_MS) continue;
    if (entry.mode === "stories") stories += 1;
    else lessons += 1;
  }
  return { lessons, stories };
}

/** How many stories were finished on the learner's own day. */
export function storiesFinishedOn(
  completions: readonly CompletionLike[],
  todayISO: string,
  dayOf: (iso: string) => string,
): number {
  return completions.filter(
    (entry) => entry.mode === "stories" && dayOf(entry.completedAt) === todayISO,
  ).length;
}
