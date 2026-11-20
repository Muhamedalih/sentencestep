import type { VideoLesson, VideoSentence } from "./types";

/**
 * Where one sentence of a video starts (the replay begins just before it) and ends (the video stops
 * there), in seconds from the start of the whole YouTube video. An Admin can move these by hand from the
 * practice screen: what he saves replaces the times written in the video's file, nothing else of it.
 */
export interface VideoTiming {
  id: string;
  startSeconds: number;
  endSeconds: number;
}

/** A sentence shorter than this cannot be heard, let alone typed after: it is a slip of the hand. */
export const MIN_SENTENCE_SECONDS = 0.3;

export function timingsOf(sentences: readonly VideoSentence[]): VideoTiming[] {
  return sentences.map(({ id, startSeconds, endSeconds }) => ({ id, startSeconds, endSeconds }));
}

const round = (seconds: number) => Math.round(seconds * 100) / 100;

/**
 * A fingerprint of the times of a list of sentences (to the hundredth of a second, as they are saved):
 * two lists with the same key play the same, so the editor can tell whether what is on the Admin's screen
 * is what the database holds, and so what every other viewer plays.
 */
export function timingsKey(sentences: readonly VideoSentence[]): string {
  return JSON.stringify(
    sentences.map(({ id, startSeconds, endSeconds }) => [id, round(startSeconds), round(endSeconds)]),
  );
}

/**
 * Checks times that came from the browser (a Server Action is reachable as a direct POST) or from the
 * database against the video they are for: one entry per sentence in the sentences' own order, each
 * inside the video, long enough, and the stops in increasing order. Returns them rounded to a hundredth
 * of a second, or null when anything is off, so a bad row never reaches a learner.
 */
export function sanitizeTimings(input: unknown, lesson: VideoLesson): VideoTiming[] | null {
  if (!Array.isArray(input) || input.length !== lesson.sentences.length) return null;
  const result: VideoTiming[] = [];
  for (const [at, raw] of input.entries()) {
    const sentence = lesson.sentences[at];
    if (!sentence || typeof raw !== "object" || raw === null) return null;
    const { id, startSeconds, endSeconds } = raw as Record<string, unknown>;
    if (id !== sentence.id) return null;
    if (typeof startSeconds !== "number" || typeof endSeconds !== "number") return null;
    if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) return null;
    const start = round(startSeconds);
    const end = round(endSeconds);
    if (start < 0 || end > lesson.durationSeconds + 1) return null;
    if (end - start < MIN_SENTENCE_SECONDS) return null;
    const before = result[at - 1];
    if (before && end <= before.endSeconds) return null;
    result.push({ id: sentence.id, startSeconds: start, endSeconds: end });
  }
  return result;
}

/** The video with the saved times in place of its own (the lesson itself when there are none). */
export function applyTimings(lesson: VideoLesson, saved: unknown): VideoLesson {
  const timings = saved === null || saved === undefined ? null : sanitizeTimings(saved, lesson);
  if (!timings) return lesson;
  return {
    ...lesson,
    sentences: lesson.sentences.map((sentence, at) => ({
      ...sentence,
      startSeconds: timings[at]!.startSeconds,
      endSeconds: timings[at]!.endSeconds,
    })),
  };
}
