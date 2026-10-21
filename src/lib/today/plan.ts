import { estimateSessionMinutes } from "@/lib/features/daily-session";
import { LESSON_MINUTES } from "@/lib/session-end/summary";

/**
 * Pure rules behind Home's "Today's session" (permission "Today's session (new Home)"): which
 * blocks a session has for a learner today — review, one new lesson or story, a short recall — and
 * how long each takes. No I/O: the loader (load.ts) reads what is due and what is next, this only
 * decides. Everything is plain rules, never a model.
 */

export const SESSION_LENGTHS = [3, 7, 12] as const;
export type SessionLength = (typeof SESSION_LENGTHS)[number];
export const DEFAULT_SESSION_LENGTH: SessionLength = 7;
/** A learner away this many days gets the gentle comeback session. */
export const COMEBACK_AFTER_DAYS = 3;
/** Fewest due words worth opening a regular session with a review block. */
export const MIN_REVIEW_ITEMS = 3;
/** How many sentences the closing recall asks back, by session length. */
export const RECALL_BY_LENGTH: Record<SessionLength, number> = { 3: 0, 7: 3, 12: 4 };
/** How many review words fit in each session length. */
export const REVIEW_CAP: Record<SessionLength, number> = { 3: 8, 7: 8, 12: 14 };
/**
 * A "tidying day" (review only) is for a pile that built up recently: more due than twice what the
 * session holds, but not more than five times. A backlog beyond that is years old (a learner who
 * never corrected their mistakes) — it drains eight words a session while they keep moving on,
 * instead of freezing their path for weeks.
 */
export const REVIEW_ONLY_FACTOR = 2;
export const CHRONIC_BACKLOG_FACTOR = 5;
/** Minutes the opening lesson's five sentences take. */
export const FIRST_LESSON_MINUTES = 2;

export function isSessionLength(value: unknown): value is SessionLength {
  return SESSION_LENGTHS.some((length) => length === value);
}

export function parseSessionLength(value: unknown): SessionLength {
  const parsed = typeof value === "string" ? Number(value) : value;
  return isSessionLength(parsed) ? parsed : DEFAULT_SESSION_LENGTH;
}

export type TodayVariant = "first" | "regular" | "reviewOnly" | "comeback" | "idle";

export type TodayStep =
  | { kind: "review"; items: number; minutes: number }
  | { kind: "new"; minutes: number }
  | { kind: "recall"; items: number; minutes: number };

export interface TodayPlan {
  variant: TodayVariant;
  length: SessionLength;
  steps: TodayStep[];
}

export interface TodayInput {
  length: SessionLength;
  /** Words waiting for review right now (the raw count — the plan applies the cap). */
  dueReview: number;
  /** A new lesson or story this learner can open is waiting. */
  hasNew: boolean;
  /** The learner has finished at least one lesson. */
  hasHistory: boolean;
  /** Whole days since the last finished lesson or session, null when there is none. */
  daysAway: number | null;
}

function reviewStep(items: number): TodayStep {
  return { kind: "review", items, minutes: estimateSessionMinutes(items) };
}

/**
 * The plan for one session length:
 *  - first: no lesson finished yet — just the opening lesson (its own recall follows it).
 *  - comeback: away for days — a light review only, nothing new until it is done.
 *  - reviewOnly: more due than twice what the session holds, but not a years-old backlog (see
 *    CHRONIC_BACKLOG_FACTOR) — review only, "a tidying day".
 *  - regular: review first when at least a few words are due, then one new lesson, then the recall.
 *    The 3-minute session is review only (a busy day), or one lesson when nothing is due.
 *  - idle: nothing to review and nothing new to open.
 */
export function planToday(input: TodayInput): TodayPlan {
  const { length, dueReview, hasNew, hasHistory, daysAway } = input;
  const cap = REVIEW_CAP[length];
  const items = Math.min(Math.max(dueReview, 0), cap);

  if (!hasHistory) {
    return hasNew
      ? { variant: "first", length, steps: [{ kind: "new", minutes: FIRST_LESSON_MINUTES }] }
      : { variant: "idle", length, steps: [] };
  }
  if (daysAway !== null && daysAway >= COMEBACK_AFTER_DAYS && dueReview > 0) {
    return { variant: "comeback", length, steps: [reviewStep(items)] };
  }
  if (dueReview > cap * REVIEW_ONLY_FACTOR && dueReview <= cap * CHRONIC_BACKLOG_FACTOR) {
    return { variant: "reviewOnly", length, steps: [reviewStep(items)] };
  }

  const steps: TodayStep[] = [];
  if (dueReview >= MIN_REVIEW_ITEMS || (length === 3 && dueReview > 0)) {
    steps.push(reviewStep(items));
  }
  if (hasNew && (length !== 3 || steps.length === 0)) {
    steps.push({ kind: "new", minutes: LESSON_MINUTES });
    if (RECALL_BY_LENGTH[length] > 0) {
      steps.push({ kind: "recall", items: RECALL_BY_LENGTH[length], minutes: 1 });
    }
  }
  return { variant: steps.length === 0 ? "idle" : "regular", length, steps };
}

export function planAllLengths(
  input: Omit<TodayInput, "length">,
): Record<SessionLength, TodayPlan> {
  return {
    3: planToday({ ...input, length: 3 }),
    7: planToday({ ...input, length: 7 }),
    12: planToday({ ...input, length: 12 }),
  };
}

/** What a comeback learner starts on: the short one. Everyone else gets the usual 7. */
export function defaultLengthFor(variant: TodayVariant): SessionLength {
  return variant === "comeback" ? 3 : DEFAULT_SESSION_LENGTH;
}

/**
 * Where "Start" goes. The review runs first when the plan has one — and `then` tells it what comes
 * after (the lesson, or straight to the finish screen); otherwise straight into the lesson, which
 * ends on the recall and the finish screen. Null when there is nothing to start.
 */
export function startHref(
  plan: TodayPlan,
  next: { id: string; mode: string } | null,
): string | null {
  const first = plan.steps[0];
  if (!first) return null;
  if (first.kind === "review") {
    const then = plan.steps.some((step) => step.kind === "new") ? "lesson" : "end";
    return `/learn/session/today?length=${plan.length}&then=${then}`;
  }
  if (first.kind === "new" && next) {
    return `/learn/${next.mode}/${next.id}?today=1&length=${plan.length}`;
  }
  return null;
}

/** The whole days between two learner-local "YYYY-MM-DD" dates (later minus earlier). */
export function daysBetween(earlierISO: string, laterISO: string): number {
  const earlier = Date.parse(`${earlierISO}T00:00:00Z`);
  const later = Date.parse(`${laterISO}T00:00:00Z`);
  if (Number.isNaN(earlier) || Number.isNaN(later)) return 0;
  return Math.round((later - earlier) / 86_400_000);
}
