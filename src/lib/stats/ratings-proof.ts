import { roundDownForDisplay } from "./social-proof";

/**
 * The average rating and number of ratings quoted on /upgrade, worked out from
 * the ratings in the database (see public-ratings.ts). Nothing is shown until
 * there are enough ratings to be worth quoting; the average is only ever
 * rounded DOWN and the count rounded down like every other figure here.
 */
export const MIN_RATINGS_TO_QUOTE = 20;

export interface RatingsProof {
  /** Average out of 5, rounded down to one decimal. */
  average: number;
  /** Number of ratings, rounded down. */
  count: number;
}

/**
 * `perStar` is how many ratings gave each star: index 0 = 1 star ... index 4 =
 * 5 stars. The average is taken from these exact counts (not from an already
 * rounded average) so the quoted figure can never end up higher than the true one.
 */
export function buildRatingsProof(perStar: readonly number[]): RatingsProof | null {
  if (perStar.length !== 5 || perStar.some((n) => !Number.isInteger(n) || n < 0)) return null;

  const count = perStar.reduce((sum, n) => sum + n, 0);
  if (count < MIN_RATINGS_TO_QUOTE) return null;

  const average = perStar.reduce((sum, n, index) => sum + n * (index + 1), 0) / count;
  return {
    // toFixed first so binary rounding noise (4.3 * 10 = 42.99999...) can't cost a tenth.
    average: Math.floor(Number((average * 10).toFixed(6))) / 10,
    count: roundDownForDisplay(count),
  };
}
