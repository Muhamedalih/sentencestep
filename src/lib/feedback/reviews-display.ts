/**
 * The rotating "what our learners say" box (LearnerReviews): which ratings it
 * shows and for how long each one stays. Pure, so the server (which resolves the
 * times) and the admin form (which validates them) agree exactly.
 */

/** At most this many approved ratings rotate in the box (the newest ones). */
export const PUBLIC_REVIEWS_MAX = 10;

export const MIN_DISPLAY_SECONDS = 1;
export const MAX_DISPLAY_SECONDS = 30;

/** A comment up to this long is quick to read; anything longer gets a little more time. */
export const SHORT_COMMENT_CHARS = 60;
const SHORT_COMMENT_SECONDS = 1;
const LONG_COMMENT_SECONDS = 2;

/** What the box does with no number set by an admin: a short comment 1 second, a longer one 2. */
export function autoDisplaySeconds(comment: string): number {
  return comment.trim().length <= SHORT_COMMENT_CHARS
    ? SHORT_COMMENT_SECONDS
    : LONG_COMMENT_SECONDS;
}

/** The seconds a rating stays on screen: the admin's number if there is one, otherwise the automatic time. */
export function resolveDisplaySeconds(comment: string, pinned: number | null | undefined): number {
  if (typeof pinned === "number" && Number.isInteger(pinned)) {
    return Math.min(MAX_DISPLAY_SECONDS, Math.max(MIN_DISPLAY_SECONDS, pinned));
  }
  return autoDisplaySeconds(comment);
}

export type ParsedDisplaySeconds =
  { ok: true; value: number | null } | { ok: false; error: string };

/** The admin's input: empty means automatic (null); otherwise a whole number of seconds from 1 to 30. */
export function parseDisplaySeconds(input: unknown): ParsedDisplaySeconds {
  if (input === null || input === undefined) return { ok: true, value: null };
  if (typeof input === "string" && input.trim() === "") return { ok: true, value: null };

  // A typed value must be plain digits ("1e1" and "0x5" are not a number of seconds).
  const value =
    typeof input === "string"
      ? /^\d{1,3}$/.test(input.trim())
        ? Number(input.trim())
        : NaN
      : input;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < MIN_DISPLAY_SECONDS ||
    value > MAX_DISPLAY_SECONDS
  ) {
    return {
      ok: false,
      error: `Enter a whole number of seconds from ${MIN_DISPLAY_SECONDS} to ${MAX_DISPLAY_SECONDS}, or leave it empty for automatic.`,
    };
  }
  return { ok: true, value };
}

/** One rating as the box gets it: the words, the stars, and the final number of seconds. */
export interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  seconds: number;
}

/** Turns approved ratings into what the box shows: only ones with words, at most PUBLIC_REVIEWS_MAX, each with its resolved time. */
export function toReviewItems(
  ratings: readonly {
    id: string;
    rating: number;
    comment: string;
    displaySeconds: number | null;
  }[],
): ReviewItem[] {
  return ratings
    .filter((r) => r.comment.trim() !== "" && r.rating >= 1 && r.rating <= 5)
    .slice(0, PUBLIC_REVIEWS_MAX)
    .map((r) => ({
      id: r.id,
      rating: Math.round(r.rating),
      comment: r.comment.trim(),
      seconds: resolveDisplaySeconds(r.comment, r.displaySeconds),
    }));
}

/** The next rating to show, wrapping back to the first after the last. */
export function nextReviewIndex(current: number, count: number): number {
  return count <= 0 ? 0 : (current + 1) % count;
}

/**
 * Reads what /api/reviews answered, keeping only well-formed items — the box
 * never trusts the network. Anything off (not an array, a missing field, no
 * words) is dropped rather than shown.
 */
export function parseReviewsResponse(json: unknown): ReviewItem[] {
  const list = (json as { reviews?: unknown } | null)?.reviews;
  if (!Array.isArray(list)) return [];

  const items: ReviewItem[] = [];
  for (const entry of list) {
    if (typeof entry !== "object" || entry === null) continue;
    const { id, rating, comment, seconds } = entry as Record<string, unknown>;
    if (
      typeof id !== "string" ||
      typeof comment !== "string" ||
      comment.trim() === "" ||
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      continue;
    }
    items.push({
      id,
      rating,
      comment: comment.slice(0, 2000),
      seconds: resolveDisplaySeconds(comment, typeof seconds === "number" ? seconds : null),
    });
    if (items.length === PUBLIC_REVIEWS_MAX) break;
  }
  return items;
}
