import { roundDownForDisplay } from "./social-proof";

/**
 * The average rating and number of ratings quoted on /upgrade. The app keeps
 * ratings in the owner's own spreadsheet, not in the database, so the two
 * figures are entered by the owner as environment variables, copied from that
 * sheet. Nothing is shown until both are set, believable and based on enough
 * ratings; the average is only ever rounded DOWN and the count rounded down
 * like every other figure here.
 */
export const MIN_RATINGS_TO_QUOTE = 20;

export interface RatingsProof {
  /** Average out of 5, rounded down to one decimal. */
  average: number;
  /** Number of ratings, rounded down. */
  count: number;
}

export function parseRatingsProof(
  rawAverage: string | undefined,
  rawCount: string | undefined,
): RatingsProof | null {
  const averageText = rawAverage?.trim();
  const countText = rawCount?.trim();
  if (!averageText || !countText) return null;

  const average = Number(averageText);
  const count = Number(countText);
  if (!Number.isFinite(average) || average < 1 || average > 5) return null;
  if (!Number.isInteger(count) || count < MIN_RATINGS_TO_QUOTE) return null;

  return {
    // toFixed first so binary rounding noise (4.3 * 10 = 42.99999...) can't cost a tenth.
    average: Math.floor(Number((average * 10).toFixed(6))) / 10,
    count: roundDownForDisplay(count),
  };
}

export function getRatingsProof(): RatingsProof | null {
  return parseRatingsProof(process.env.SOCIAL_PROOF_RATING, process.env.SOCIAL_PROOF_RATING_COUNT);
}
