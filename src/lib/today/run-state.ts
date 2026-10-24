/**
 * What Today's session carries from one screen to the next, in the browser tab only: the words
 * step's result (so the finish screen can say how many words were remembered). sessionStorage,
 * dated — a result from another day is never shown. Every access is wrapped, because storage can
 * be blocked or full, and the session works without it (the finish screen just leaves the number
 * out).
 */

const KEY = "looma:today-run";

export interface TodayRun {
  date: string;
  /** Words asked and typed right the first time, over the rounds so far today, or null when there was none. */
  review: { clean: number; total: number } | null;
}

export function writeTodayRun(run: TodayRun): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(run));
  } catch {
    // Blocked or full: the finish screen simply has no number.
  }
}

/** The stored words result for `todayISO`, or null for none (or another day's). */
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

const TEST_KEY = "looma:today-test";

export interface TodayTestResult {
  /** Questions typed right with no help, over the questions asked. */
  clean: number;
  total: number;
}

/** The stored test result for `todayISO` from its raw text, or null when it is missing, another day's, or not a result. */
export function parseTodayTest(raw: string | null, todayISO: string): TodayTestResult | null {
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as { date?: unknown; clean?: unknown; total?: unknown } | null;
    const { date, clean, total } = stored ?? {};
    if (
      date === todayISO &&
      typeof clean === "number" &&
      typeof total === "number" &&
      Number.isInteger(clean) &&
      Number.isInteger(total) &&
      total > 0 &&
      clean >= 0 &&
      clean <= total
    ) {
      return { clean, total };
    }
  } catch {
    // Unreadable: treated as no result.
  }
  return null;
}

/**
 * How the day's test went, kept on this device (localStorage, dated) so Home can say so and offer
 * another round when something did not stick. Nothing is sent anywhere; a device that never took
 * the test simply has no result, and Home then shows the plain "done" card.
 */
export function writeTodayTest(todayISO: string, result: TodayTestResult): void {
  try {
    window.localStorage.setItem(TEST_KEY, JSON.stringify({ date: todayISO, ...result }));
  } catch {
    // Blocked or full: Home shows the plain "done" card.
  }
}

export function readTodayTest(todayISO: string): TodayTestResult | null {
  try {
    return parseTodayTest(window.localStorage.getItem(TEST_KEY), todayISO);
  } catch {
    return null;
  }
}

/** Whether this page was opened as a step of Today's session (`?today=1`) — read only in the browser, after mount. */
export function isTodayRunUrl(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("today") === "1";
  } catch {
    return false;
  }
}
