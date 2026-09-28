/**
 * Local, best-effort state for RatingPrompt/RatingModal — whether this
 * browser has genuinely rated (permanent), how many times the automatic
 * prompt has been shown (bounded, see MAX_PROMPT_SHOWS), and a stable
 * anonymous id to include with a guest submission so the ratings sheet can
 * dedupe without ever touching a real account id. Same guest/local-only
 * pattern and defensive try/catch-around-every-access shape as
 * src/lib/progress/lesson-resume.ts: a blocked or full localStorage must
 * never throw, and a storage failure is treated as "already rated" rather
 * than "never asked", so the safe failure mode is silence, not a repeat
 * prompt.
 *
 * Being shown is no longer a permanent one-way door by itself — a plain
 * skip only spends one of a small, bounded number of future re-asks (see
 * shouldShowRatingPrompt/recordPromptShown), so a learner who was just busy
 * the first time still gets a couple more chances at later milestones. Only
 * a genuine response — a star tap, or a submitted note on the "not quite"
 * path — sets the permanent `rated` flag (markRatedApp) that retires the
 * prompt for good.
 */

const STATE_KEY = "looma:rating-state:v2";
const LEGACY_SHOWN_KEY = "looma:rated-app:v1";
const ANON_ID_KEY = "looma:rating-anon-id:v1";

/** How many times the automatic prompt may ever be shown to one browser before it stops asking for good, regardless of milestones reached. */
export const MAX_PROMPT_SHOWS = 3;

interface RatingState {
  rated: boolean;
  shownCount: number;
}

const NEVER_ASK_AGAIN: RatingState = { rated: false, shownCount: MAX_PROMPT_SHOWS };

function readState(): RatingState {
  if (typeof window === "undefined") return NEVER_ASK_AGAIN;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RatingState>;
      return {
        rated: parsed.rated === true,
        shownCount: typeof parsed.shownCount === "number" ? parsed.shownCount : 0,
      };
    }
    // v1 only ever recorded "the one-time prompt was shown" and explicitly
    // promised "you won't see this again" the instant it appeared — honor
    // that promise for anyone who already saw it under the old copy, rather
    // than surprising them with a re-ask under this bounded-retry scheme. A
    // browser with no v1 flag either is genuinely new or predates rating
    // entirely, so it starts fresh.
    return window.localStorage.getItem(LEGACY_SHOWN_KEY) === "1"
      ? NEVER_ASK_AGAIN
      : { rated: false, shownCount: 0 };
  } catch {
    return NEVER_ASK_AGAIN;
  }
}

function writeState(state: RatingState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort only — worst case the prompt can show again later.
  }
}

export function hasRatedApp(): boolean {
  return readState().rated;
}

/** Whether the automatic prompt is still allowed to show at all right now — false once genuinely rated, or once it's been shown MAX_PROMPT_SHOWS times with no rating. */
export function shouldShowRatingPrompt(): boolean {
  const state = readState();
  return !state.rated && state.shownCount < MAX_PROMPT_SHOWS;
}

/** Called the instant the prompt is actually displayed — spends one of its bounded re-asks, whether or not the learner goes on to rate, comment, or skip. */
export function recordPromptShown(): void {
  const state = readState();
  writeState({ ...state, shownCount: state.shownCount + 1 });
}

/** Called only on a genuine response — a star tap, or a submitted "what could we do better" note — never on a plain skip. Permanent: retires the prompt for good, from any caller (RatingPrompt's automatic pop-up or Settings' always-available RateAppCard). */
export function markRatedApp(): void {
  const state = readState();
  writeState({ ...state, rated: true });
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
