/**
 * What an Admin's device reports about how the video's stops land on it (see reportVideoDeviceAction):
 * the numbers that tell why a stop is late on one device and not on another, read from the audit log
 * instead of guessed. Pure, so the shape is checked apart from the page.
 */

/** One stop of the sentence: where it was asked for, what the page read when it fired, where the video came to rest. */
export interface StopSample {
  /** The sentence's end in the video (seconds). */
  end: number;
  /** The total lead the stop was asked with (learned delay plus the Admin's own offset). */
  lead: number;
  /** The playhead reading that made the page pause the video. */
  trigger: number;
  /** Where the video rested, read 200 ms after the pause. */
  rest: number;
  /** The longest wait between two readings while the sentence played (ms): a busy device reads rarely. */
  maxGapMs: number;
}

export interface DeviceReport {
  videoId: string;
  userAgent: string;
  touchPoints: number;
  apple: boolean;
  /** The delay the page has learned on this device (seconds). */
  learnedLead: number;
  /** The Admin's own offset on this device (seconds). */
  offset: number;
  /** The video's length in the file, and the length the player last reported when it was not the video's (null when it always was). */
  expectedDuration: number;
  seenDuration: number | null;
  /** Readings counted as an ad because the player's length was not the video's, and the times the page needed a tap to go on. */
  adReadings: number;
  needsTaps: number;
  stops: StopSample[];
}

export const MAX_STOPS_PER_REPORT = 40;

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const round = (value: number, places = 3) => {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
};

/** Checks a report that came from the browser: every number finite and in range, the lists short, the text cut. Null when it does not fit. */
export function sanitizeDeviceReport(input: unknown): DeviceReport | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (typeof raw.videoId !== "string" || raw.videoId.length === 0 || raw.videoId.length > 120) return null;
  if (typeof raw.userAgent !== "string" || typeof raw.apple !== "boolean") return null;
  if (!finite(raw.touchPoints) || !finite(raw.learnedLead) || !finite(raw.offset)) return null;
  if (!finite(raw.expectedDuration) || !finite(raw.adReadings) || !finite(raw.needsTaps)) return null;
  if (raw.seenDuration !== null && !finite(raw.seenDuration)) return null;
  if (!Array.isArray(raw.stops)) return null;

  const stops: StopSample[] = [];
  for (const item of raw.stops.slice(-MAX_STOPS_PER_REPORT)) {
    if (typeof item !== "object" || item === null) return null;
    const { end, lead, trigger, rest, maxGapMs } = item as Record<string, unknown>;
    if (!finite(end) || !finite(lead) || !finite(trigger) || !finite(rest) || !finite(maxGapMs)) return null;
    stops.push({
      end: round(end, 2),
      lead: round(lead),
      trigger: round(trigger),
      rest: round(rest),
      maxGapMs: Math.round(Math.min(60_000, Math.max(0, maxGapMs))),
    });
  }

  return {
    videoId: raw.videoId,
    userAgent: raw.userAgent.slice(0, 200),
    touchPoints: Math.min(20, Math.max(0, Math.round(raw.touchPoints))),
    apple: raw.apple,
    learnedLead: round(raw.learnedLead),
    offset: round(raw.offset),
    expectedDuration: round(raw.expectedDuration, 2),
    seenDuration: raw.seenDuration === null ? null : round(raw.seenDuration, 2),
    adReadings: Math.min(100_000, Math.max(0, Math.round(raw.adReadings))),
    needsTaps: Math.min(1_000, Math.max(0, Math.round(raw.needsTaps))),
    stops,
  };
}

/** The Admin's own offset: how much earlier than the learned delay this device should stop, by ear, in seconds. */
export const MIN_OFFSET_SECONDS = -0.3;
export const MAX_OFFSET_SECONDS = 0.8;
export const OFFSET_STORAGE_KEY = "video-stop-offset";
export const OFFSET_STEP_SECONDS = 0.05;

export function clampOffset(seconds: number): number {
  if (!Number.isFinite(seconds)) return 0;
  return Math.round(Math.min(MAX_OFFSET_SECONDS, Math.max(MIN_OFFSET_SECONDS, seconds)) * 100) / 100;
}

/** The part of a stop's lateness the page can see (it rested after the end by this much, beyond the Admin's offset), for the editor's summary. */
export function overshootOf(sample: StopSample): number {
  return Math.round((sample.rest - sample.end) * 1000) / 1000;
}
