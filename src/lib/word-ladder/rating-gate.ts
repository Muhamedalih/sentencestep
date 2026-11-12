/**
 * When the rating card of the word rounds is offered. It is asked once the learner has finished a
 * round (so they have something to judge), and "not now" is respected: it is asked again only after
 * three more finished rounds, and never more than twice in all. A learner who rated is never asked
 * again. Pure, so the browser storage that keeps it (rating-storage.ts) and the tests share it.
 */

export interface RoundsRatingState {
  /** The learner rated (or left a comment): never ask again. */
  rated: boolean;
  /** How many times "not now" was chosen. */
  skips: number;
  /** Rounds finished on this device since the first one. */
  finished: number;
}

export const EMPTY_ROUNDS_RATING_STATE: RoundsRatingState = { rated: false, skips: 0, finished: 0 };

/** After "not now" the card waits this many finished rounds. */
export const ROUNDS_BETWEEN_ASKS = 3;
/** "Not now" is allowed this many times; after that the card is retired. */
export const MAX_ROUNDS_RATING_SKIPS = 2;

/** A round was finished: the count goes up by one. */
export function withFinishedRound(state: RoundsRatingState): RoundsRatingState {
  return { ...state, finished: state.finished + 1 };
}

/** Whether to show the card now, after `withFinishedRound`. */
export function shouldAskRoundsRating(state: RoundsRatingState): boolean {
  if (state.rated || state.skips >= MAX_ROUNDS_RATING_SKIPS) return false;
  return state.finished >= 1 + state.skips * ROUNDS_BETWEEN_ASKS;
}

export function withRated(state: RoundsRatingState): RoundsRatingState {
  return { ...state, rated: true };
}

export function withSkip(state: RoundsRatingState): RoundsRatingState {
  return { ...state, skips: state.skips + 1 };
}

/** What storage held, turned into a state; anything that is not one gives the empty state. */
export function parseRoundsRatingState(raw: string | null): RoundsRatingState {
  if (!raw) return EMPTY_ROUNDS_RATING_STATE;
  try {
    const value = JSON.parse(raw) as Partial<RoundsRatingState> | null;
    if (typeof value !== "object" || value === null) return EMPTY_ROUNDS_RATING_STATE;
    const count = (n: unknown) =>
      typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 10_000 ? n : 0;
    return {
      rated: value.rated === true,
      skips: count(value.skips),
      finished: count(value.finished),
    };
  } catch {
    return EMPTY_ROUNDS_RATING_STATE;
  }
}
