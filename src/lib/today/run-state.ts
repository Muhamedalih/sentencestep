import { parseSessionLength } from "@/lib/today/plan";
import type { SessionLength } from "@/lib/today/plan";

/**
 * What Today's session carries from one screen to the next, in the browser tab only: the review
 * block's result (so the finish screen can say how many words were remembered) and the length the
 * learner picked. sessionStorage, dated — a result from another day is never shown. Every access is
 * wrapped, because storage can be blocked or full, and the session works without it (the finish
 * screen just leaves the number out).
 */

const KEY = "looma:today-run";

export interface TodayRun {
  date: string;
  length: SessionLength;
  /** Review words asked and typed right the first time, or null when the session had no review. */
  review: { clean: number; total: number } | null;
}

export function writeTodayRun(run: TodayRun): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(run));
  } catch {
    // Blocked or full: the finish screen simply has no review number.
  }
}

/** The stored review result for `todayISO`, or null for none (or another day's). */
export function readTodayReview(todayISO: string): TodayRun["review"] {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as Partial<TodayRun> | null;
    const review = run?.review;
    if (
      run?.date === todayISO &&
      review &&
      Number.isInteger(review.total) &&
      Number.isInteger(review.clean) &&
      review.total > 0 &&
      review.clean >= 0 &&
      review.clean <= review.total
    ) {
      return { clean: review.clean, total: review.total };
    }
  } catch {
    // Unreadable: treated as no result.
  }
  return null;
}

/** Whether this page was opened as a step of Today's session (`?today=1`) — read only in the browser, after mount. */
export function isTodayRunUrl(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("today") === "1";
  } catch {
    return false;
  }
}

/** The length in the address (`?length=`), 7 when absent or not one of 3, 7, 12. */
export function todayLengthFromUrl(): SessionLength {
  try {
    return parseSessionLength(new URLSearchParams(window.location.search).get("length"));
  } catch {
    return parseSessionLength(null);
  }
}
