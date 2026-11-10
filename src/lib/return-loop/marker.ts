/**
 * The note a guest leaves in their own browser when they reach the sign-up page after the opening
 * lesson: "this browser finished <lesson> as a guest". If they then sign up, the first Home visit
 * of the new account shows the return loop's card once (see ReturnWelcome), with tomorrow's lesson
 * worked out from that lesson, because the guest's progress may not have reached the account yet.
 * Nothing is sent to the server by this: it is read and removed in the same browser. Pure around a
 * storage object so it can be tested.
 */
export const RETURN_MARKER_KEY = "ss_return_ask";

/** A note older than this is ignored: a guest who signs up days later is not shown a "tomorrow" about a lesson from last week. */
export const RETURN_MARKER_MAX_AGE_MS = 3 * 24 * 3_600_000;

export interface ReturnMarker {
  mode: "normal" | "stories";
  lessonId: string;
  at: number;
}

export interface MarkerStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** The lesson a path such as /learn/normal/onboarding-beginner names, or null. */
export function lessonFromPath(
  pathname: string,
): { mode: "normal" | "stories"; lessonId: string } | null {
  const match = /^\/learn\/(normal|stories)\/([\w-]{1,200})\/?$/.exec(pathname);
  return match ? { mode: match[1] as "normal" | "stories", lessonId: match[2] as string } : null;
}

export function writeReturnMarker(
  storage: MarkerStorage,
  lesson: { mode: "normal" | "stories"; lessonId: string },
  now: number,
): void {
  try {
    storage.setItem(RETURN_MARKER_KEY, JSON.stringify({ ...lesson, at: now }));
  } catch {
    // Private mode or a full store: the card is simply not shown after sign-up.
  }
}

/** Reads the note and removes it, so a reload never shows the card twice; null when there is none, it is too old or malformed. */
export function takeReturnMarker(storage: MarkerStorage, now: number): ReturnMarker | null {
  try {
    const raw = storage.getItem(RETURN_MARKER_KEY);
    if (raw === null) return null;
    storage.removeItem(RETURN_MARKER_KEY);
    const parsed = JSON.parse(raw) as Partial<ReturnMarker> | null;
    if (
      !parsed ||
      (parsed.mode !== "normal" && parsed.mode !== "stories") ||
      typeof parsed.lessonId !== "string" ||
      !/^[\w-]{1,200}$/.test(parsed.lessonId) ||
      typeof parsed.at !== "number" ||
      now - parsed.at < 0 ||
      now - parsed.at > RETURN_MARKER_MAX_AGE_MS
    ) {
      return null;
    }
    return { mode: parsed.mode, lessonId: parsed.lessonId, at: parsed.at };
  } catch {
    return null;
  }
}
