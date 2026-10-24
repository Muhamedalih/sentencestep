import { IP_FAILURE_LIMITS, USER_FAILURE_LIMITS } from "./constants";

export interface FailureLimit {
  readonly windowMs: number;
  readonly max: number;
}

/** What was recorded for a try, as the box saw it. Only the failures count against the limits. */
export type AttemptOutcome =
  "ok" | "used_by_you" | "unlimited" | "unknown" | "used" | "voided" | "expired" | "bad_format";

const NOT_FAILURES: readonly AttemptOutcome[] = ["ok", "used_by_you", "unlimited"];

/**
 * A try that tells the learner nothing is wrong with their code. A code with a bad check symbol is
 * a typo, which is a failure of the try, not of the code, so it is NOT recorded as one (the box says
 * "check the letters" without charging an attempt).
 */
export function countsAsFailure(outcome: AttemptOutcome): boolean {
  return outcome !== "bad_format" && !NOT_FAILURES.includes(outcome);
}

export type AttemptDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/** Seconds until fewer than `max` of these failures are still inside the window; 0 when that is already so. */
function secondsUntilRoom(failures: readonly number[], limit: FailureLimit, now: number): number {
  const recent = failures.filter((at) => at > now - limit.windowMs).sort((a, b) => a - b);
  if (recent.length < limit.max) return 0;
  // The failure that must leave the window for the count to drop below the limit.
  const mustExpire = recent[recent.length - limit.max]!;
  return Math.max(1, Math.ceil((mustExpire + limit.windowMs - now) / 1000));
}

/**
 * Whether one more try is allowed. A learner is paused after 5 wrong codes in ten minutes (or 20 in a
 * day); an address after 40 an hour. A guess costs the guesser time, an honest slip costs a short wait.
 */
export function decideAttempt(
  input: {
    /** When this learner's failed tries happened (epoch ms). */
    userFailures: readonly number[];
    /** The same for the address the request came from. */
    ipFailures: readonly number[];
    now: Date;
  },
  limits: { user: readonly FailureLimit[]; ip: readonly FailureLimit[] } = {
    user: USER_FAILURE_LIMITS,
    ip: IP_FAILURE_LIMITS,
  },
): AttemptDecision {
  const now = input.now.getTime();
  let wait = 0;
  for (const limit of limits.user) {
    wait = Math.max(wait, secondsUntilRoom(input.userFailures, limit, now));
  }
  for (const limit of limits.ip) {
    wait = Math.max(wait, secondsUntilRoom(input.ipFailures, limit, now));
  }
  return wait === 0 ? { allowed: true } : { allowed: false, retryAfterSeconds: wait };
}
