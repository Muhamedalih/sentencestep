/**
 * What a device reports about how the video's stops land on it (see reportVideoDeviceAction): the numbers
 * that tell why a stop is late on one device and not on another, read from the analytics events instead of
 * guessed. Sent by every Apple browser (Safari, and every browser on an iPhone or iPad, where the late stops
 * were found), by a tenth of the other devices (to compare with) and by an Admin's own. Pure, so the shape
 * is checked apart from the page.
 */

/** One stop of the sentence: where it was asked for, what the page read when it fired, where the video came to rest. */
export type StopSample = {
  /** The sentence's end in the video (seconds). */
  end: number;
  /** The total lead the stop was asked with (learned delay plus the Admin's own offset). */
  lead: number;
  /** The playhead reading that made the page pause the video. */
  trigger: number;
  /** The reading at the moment the player said "paused": a player may still answer with the time from before the pause. */
  event: number;
  /** Where the video rested, read 200 ms after the pause. */
  rest: number;
  /** The longest wait between two readings while the sentence played (ms): a busy device reads rarely. */
  maxGapMs: number;
  /** From asking the player to pause to its saying "paused" (ms). */
  pauseMs: number;
  /** The largest jump of the reading, forwards and backwards, against the time that really passed between two readings (seconds): how stale the player's own estimate gets between its messages. */
  devPlus: number;
  devMinus: number;
};

export type DeviceReport = {
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
  /** How long the player took to say "playing" after the page asked it to play (ms), the last few. */
  playMs: number[];
  stops: StopSample[];
};

export const MAX_STOPS_PER_REPORT = 40;
export const MAX_PLAY_SAMPLES = 20;

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const round = (value: number, places = 3) => {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
};
const clampMs = (value: number) => Math.round(Math.min(60_000, Math.max(0, value)));
const clampSeconds = (value: number) => round(Math.min(120, Math.max(-120, value)));

/** Checks a report that came from the browser: every number finite and in range, the lists short, the text cut. Null when it does not fit. */
export function sanitizeDeviceReport(input: unknown): DeviceReport | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (typeof raw.videoId !== "string" || raw.videoId.length === 0 || raw.videoId.length > 120) return null;
  if (typeof raw.userAgent !== "string" || typeof raw.apple !== "boolean") return null;
  if (!finite(raw.touchPoints) || !finite(raw.learnedLead) || !finite(raw.offset)) return null;
  if (!finite(raw.expectedDuration) || !finite(raw.adReadings) || !finite(raw.needsTaps)) return null;
  if (raw.seenDuration !== null && !finite(raw.seenDuration)) return null;
  if (!Array.isArray(raw.stops) || !Array.isArray(raw.playMs)) return null;

  const playMs: number[] = [];
  for (const item of raw.playMs.slice(-MAX_PLAY_SAMPLES)) {
    if (!finite(item)) return null;
    playMs.push(clampMs(item));
  }

  const stops: StopSample[] = [];
  for (const item of raw.stops.slice(-MAX_STOPS_PER_REPORT)) {
    if (typeof item !== "object" || item === null) return null;
    const sample = item as Record<string, unknown>;
    const { end, lead, trigger, event, rest, maxGapMs, pauseMs, devPlus, devMinus } = sample;
    if (
      !finite(end) ||
      !finite(lead) ||
      !finite(trigger) ||
      !finite(event) ||
      !finite(rest) ||
      !finite(maxGapMs) ||
      !finite(pauseMs) ||
      !finite(devPlus) ||
      !finite(devMinus)
    ) {
      return null;
    }
    stops.push({
      end: round(end, 2),
      lead: round(lead),
      trigger: round(trigger),
      event: round(event),
      rest: round(rest),
      maxGapMs: clampMs(maxGapMs),
      pauseMs: clampMs(pauseMs),
      devPlus: clampSeconds(devPlus),
      devMinus: clampSeconds(devMinus),
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
    playMs,
    stops,
  };
}

/** Whether this device sends a report: every Apple browser, an Admin's device, and one visit in ten of the others, to compare with. `roll` is a random number from 0 to 1. */
export function sendsDeviceReport(apple: boolean, admin: boolean, roll: number): boolean {
  return apple || admin || roll < 0.1;
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

/** How far past the sentence's end the video came to rest (seconds): positive is a late stop. */
export function overshootOf(sample: StopSample): number {
  return Math.round((sample.rest - sample.end) * 1000) / 1000;
}
