/**
 * The moments (لحظات العرض): the calm cards that offer the full plan at a moment of satisfaction, for
 * a free learner in the taste (see taste.ts). Pure: the server reads the facts (the account's age, an
 * open order, the subscription, what was shown and dismissed) and this decides, so the rules can be
 * read and tested in one place.
 *
 * B: the taste's passage is finished. D: the day's three tasks are done. star: a story is finished
 * with 90% or more. At most one moment a day, in that priority order (the first one shown wins).
 */

export const HYBRID_MOMENTS = ["B", "D", "star"] as const;

export type HybridMoment = (typeof HYBRID_MOMENTS)[number];

const DAY_MS = 86_400_000;

/** A brand-new account does not see a moment in its first day. */
export const NEW_ACCOUNT_MS = DAY_MS;

/** Two dismissals this close together pause the moments... */
export const DISMISS_WINDOW_MS = 7 * DAY_MS;

/** ...for this long, counted from the second one. */
export const DISMISS_PAUSE_MS = 7 * DAY_MS;

/**
 * Until when the moments are paused after dismissals, as an epoch time, or null when they are not.
 * Each pair of dismissals that falls within the window pauses them until seven days after the later
 * one; the pause lasts as long as the latest such pair does.
 */
export function momentPauseUntil(dismissals: readonly number[]): number | null {
  const times = [...dismissals].sort((a, b) => a - b);
  let until: number | null = null;
  for (let index = 1; index < times.length; index++) {
    const later = times[index]!;
    if (later - times[index - 1]! <= DISMISS_WINDOW_MS) {
      const candidate = later + DISMISS_PAUSE_MS;
      until = until === null ? candidate : Math.max(until, candidate);
    }
  }
  return until;
}

export type MomentBlock = "new-account" | "subscriber" | "open-order" | "shown-today" | "paused";

/**
 * Why a moment must not be shown now, or null when it may be. An account whose creation time is not
 * known is treated as new: a moment is never shown on a guess.
 */
export function momentBlock(input: {
  now: number;
  accountCreatedAt: number | null;
  isSubscriber: boolean;
  hasOpenOrder: boolean;
  shownToday: boolean;
  /** The instants (epoch ms) of this learner's dismissals in the last two weeks. */
  dismissals: readonly number[];
}): MomentBlock | null {
  if (input.accountCreatedAt === null || input.now - input.accountCreatedAt < NEW_ACCOUNT_MS) {
    return "new-account";
  }
  if (input.isSubscriber) return "subscriber";
  if (input.hasOpenOrder) return "open-order";
  if (input.shownToday) return "shown-today";
  const until = momentPauseUntil(input.dismissals);
  if (until !== null && input.now < until) return "paused";
  return null;
}
