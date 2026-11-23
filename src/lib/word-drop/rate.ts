/**
 * How often a signed-in learner's daily-challenge scores are accepted. A round takes up to two minutes
 * and cannot take less than a few seconds before the lives run out, so two scores from one learner a
 * few seconds apart come from a script, not from play. The limit is kept in the server's memory (a
 * Map per running server): it is a game, not money, so a restart that forgets it is acceptable, and
 * it costs no database read or write. Pure apart from the clock it is given.
 */

/** The least time between two scores accepted from one learner. */
export const MIN_GAP_MS = 90_000;
/** The most scores accepted from one learner in one UTC day. */
export const MAX_ROUNDS_PER_DAY = 30;
/** The most learners remembered; the oldest are dropped first when it is reached. */
const MAX_REMEMBERED = 5_000;

interface Entry {
  last: number;
  day: string;
  count: number;
}

export type RateVerdict = "ok" | "too-soon" | "too-many";

export function createScoreLimiter(
  now: () => number = Date.now,
  gapMs: number = MIN_GAP_MS,
  perDay: number = MAX_ROUNDS_PER_DAY,
) {
  const seen = new Map<string, Entry>();
  return {
    /** Asks whether this learner may record a score now, and notes it when they may. */
    check(userId: string): RateVerdict {
      const at = now();
      const day = new Date(at).toISOString().slice(0, 10);
      const entry = seen.get(userId);
      if (entry && at - entry.last < gapMs) return "too-soon";
      const count = entry && entry.day === day ? entry.count : 0;
      if (count >= perDay) return "too-many";
      seen.delete(userId);
      seen.set(userId, { last: at, day, count: count + 1 });
      if (seen.size > MAX_REMEMBERED) {
        const oldest = seen.keys().next().value;
        if (oldest !== undefined) seen.delete(oldest);
      }
      return "ok";
    },
    size: () => seen.size,
  };
}

export const scoreLimiter = createScoreLimiter();
