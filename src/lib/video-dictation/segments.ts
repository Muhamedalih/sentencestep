/**
 * How the page stops and restarts the video around a sentence. Pure, so the timing rules are tested
 * apart from the player. The numbers come from measuring YouTube's IFrame player in a browser: reading
 * getCurrentTime() every 50 ms and calling pauseVideo() at the end of a sentence lands within about
 * 0.02 to 0.05 s of it (0.04 to 0.22 s when it is read every 250 ms), and pausing itself takes about
 * 10 ms.
 */

/** How often the playhead is read while a sentence plays. */
export const POLL_MS = 30;

/** The stop is asked for this much earlier before any stop has been measured. */
export const START_LEAD_SECONDS = 0.03;

/** The most the stop is ever moved earlier to make up for a slow device. */
export const MAX_LEAD_SECONDS = 0.25;

/**
 * Every stop lands a little after the end it was asked for (the player answers late, more so on a phone).
 * After each stop the page reads where the video really paused and moves the next stop earlier or later by
 * half of the error, so it settles on the device's own delay: a stop that was late asks for a bigger lead,
 * one that was early for a smaller one. A reading far from the end (an ad, a seek) is ignored.
 */
export function nextLead(lead: number, stoppedAt: number, endSeconds: number): number {
  const error = stoppedAt - endSeconds;
  if (!Number.isFinite(error) || Math.abs(error) > 1) return lead;
  return Math.min(MAX_LEAD_SECONDS, Math.max(0, lead + 0.5 * error));
}

/** A replay starts this far before the sentence, so its first sound is not cut. */
export const REPLAY_LEAD_SECONDS = 0.2;

/** The playhead must have been seen this far before the end before reaching it counts (a stale read right after a seek does not). */
const SEEN_BEFORE_MARGIN_SECONDS = 0.3;

/** A player reporting a length this far from the video's own is playing something else: an ad. */
const SAME_VIDEO_TOLERANCE_SECONDS = 1.5;

/** The speeds the slow button cycles through: normal, then 0.75x, then 0.5x. */
export const PLAYBACK_RATES = [1, 0.75, 0.5] as const;

export function replayPosition(startSeconds: number): number {
  return Math.max(0, startSeconds - REPLAY_LEAD_SECONDS);
}

export function nextRate(rate: number): number {
  const index = PLAYBACK_RATES.findIndex((candidate) => candidate === rate);
  return PLAYBACK_RATES[(index + 1) % PLAYBACK_RATES.length] ?? 1;
}

/**
 * One reading of the playhead while a sentence plays. `endSeconds` is the time to stop at (the sentence's
 * end minus the device's lead, see nextLead). `sawBefore` remembers that the playhead has been seen
 * clearly before it, so the sentence is not stopped at once by a time read that still belongs to where the
 * video was before a seek.
 */
export function segmentTick(
  sawBefore: boolean,
  currentTime: number,
  endSeconds: number,
): { sawBefore: boolean; stop: boolean } {
  const seen = sawBefore || currentTime < endSeconds - SEEN_BEFORE_MARGIN_SECONDS;
  return { sawBefore: seen, stop: seen && currentTime >= endSeconds };
}

/** False while an ad plays: the player then reports the ad's length, not the video's. */
export function isSameVideo(playerDuration: number, expectedDuration: number): boolean {
  if (!Number.isFinite(playerDuration) || playerDuration <= 0) return false;
  return Math.abs(playerDuration - expectedDuration) <= SAME_VIDEO_TOLERANCE_SECONDS;
}
