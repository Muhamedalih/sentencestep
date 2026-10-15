/**
 * What a learner can tune while reading a passage — the narration speed and
 * the two switches (translation, listen-only) — and where those choices are
 * remembered. Pure: the storage itself lives in usePassagePreferences, so the
 * rules here (which speeds exist, how a stored value is read back) are unit
 * tests and not something to find out on a learner's phone.
 */

/**
 * The narration was recorded at a deliberately slow pace (the voice speed set in
 * Admin -> Voice), so 1x is already a learner's pace: the steps go below it for
 * a careful pass and above it to hear the passage at a natural pace. Playback
 * rate keeps the pitch, so a faster clip is the same voice, not a chipmunk.
 */
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export const DEFAULT_PLAYBACK_RATE: PlaybackRate = 1;

/** The next speed in the cycle (1.5x wraps back to 0.75x); anything that is not a known speed restarts the cycle from the default. */
export function nextPlaybackRate(current: number): PlaybackRate {
  const index = PLAYBACK_RATES.indexOf(current as PlaybackRate);
  if (index === -1) return DEFAULT_PLAYBACK_RATE;
  return PLAYBACK_RATES[(index + 1) % PLAYBACK_RATES.length] ?? DEFAULT_PLAYBACK_RATE;
}

/** Reads a stored speed back; a missing, malformed or retired value is the default, never an error. */
export function parsePlaybackRate(raw: unknown): PlaybackRate {
  const value = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return PLAYBACK_RATES.find((rate) => rate === value) ?? DEFAULT_PLAYBACK_RATE;
}

/** "1x", "0.75x", "1.25x" — the label on the speed button. */
export function formatPlaybackRate(rate: number): string {
  return `${rate}×`;
}

/** localStorage keys (versioned, so a later change of meaning can start fresh). Everything here is a per-device convenience, never state that matters. */
export const PASSAGE_PREF_KEYS = {
  translation: "ss.passages.translation.v1",
  listenOnly: "ss.passages.listenOnly.v1",
  rate: "ss.passages.rate.v1",
  tipsSeen: "ss.passages.tipsSeen.v1",
} as const;
