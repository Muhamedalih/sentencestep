/**
 * True when `audio.play()` was rejected only because the browser's autoplay
 * policy wants a user gesture first (Chrome/Edge/Safari reject with a
 * DOMException named "NotAllowedError") — as opposed to the clip itself being
 * missing or undecodable. The distinction matters: a blocked clip is fine and
 * should simply play on the learner's first key press or click, whereas
 * treating it as a broken clip makes the player swap in a different voice (or,
 * where it has no fallback, stay silent).
 */
export function isAutoplayBlockedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: unknown }).name === "NotAllowedError"
  );
}

/** One line describing why an <audio> element or play() call failed, for the console. */
export function describePlaybackFailure(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const { name, message, code } = error as { name?: unknown; message?: unknown; code?: unknown };
    const detail = typeof message === "string" && message.length > 0 ? message : undefined;
    // A DOMException from play() (name + message), or a MediaError from the element (numeric code).
    if (typeof name === "string" && name.length > 0) return detail ? `${name}: ${detail}` : name;
    if (typeof code === "number")
      return detail ? `media error ${code}: ${detail}` : `media error ${code}`;
    if (detail) return detail;
  }
  return String(error);
}
