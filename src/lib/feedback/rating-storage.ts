/**
 * Local, best-effort state for RatingPrompt — whether this browser has
 * already been shown the one-time "rate the app" prompt, and a stable
 * anonymous id to include with a submission so the ratings sheet can dedupe
 * without ever touching a real account id. Same guest/local-only pattern and
 * defensive try/catch-around-every-access shape as
 * src/lib/progress/lesson-resume.ts: a blocked or full localStorage must
 * never throw, and — since "never nag twice" matters more here than "always
 * show once" — a storage failure is treated as "already shown" rather than
 * "never shown", so the safe failure mode is silence, not a repeat prompt.
 */

const RATED_KEY = "looma:rated-app:v1";
const ANON_ID_KEY = "looma:rating-anon-id:v1";

export function hasRatedApp(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(RATED_KEY) === "1";
  } catch {
    return true;
  }
}

/** Called the instant the prompt is shown — before the learner rates, comments, or skips — so it never reappears regardless of what they do with it. */
export function markRatedApp(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATED_KEY, "1");
  } catch {
    // Best-effort only — worst case the prompt can show again later.
  }
}

/** A stable per-browser id for grouping a guest's submission in the ratings sheet — never a real account id, and never persisted server-side beyond that one row. */
export function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(ANON_ID_KEY, fresh);
    return fresh;
  } catch {
    return "";
  }
}
