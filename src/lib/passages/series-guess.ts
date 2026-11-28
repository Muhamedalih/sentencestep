/**
 * The rules of «What happens next?» (permission seriesGuess): which episode asks, when the next one
 * opens and what the learner chose. Pure: no screen and no database here.
 */

import { SERIES_GUESSES, type SeriesGuess } from "@/data/passages/series-guesses";
import { PASSAGE_SERIES } from "@/lib/passages/series";

/** The guess made at the end of this episode, or null (no next episode written yet, or no series). */
export function guessAfter(passageId: string): SeriesGuess | null {
  return SERIES_GUESSES.find((guess) => guess.after === passageId) ?? null;
}

/** The guess this episode answers, or null. */
export function guessAnsweredBy(passageId: string): SeriesGuess | null {
  return SERIES_GUESSES.find((guess) => guess.next === passageId) ?? null;
}

/** The episode before this one in its series, or null. */
export function previousEpisode(passageId: string): string | null {
  for (const series of PASSAGE_SERIES) {
    const index = series.episodes.findIndex((episode) => episode.passageId === passageId);
    if (index > 0) return series.episodes[index - 1]!.passageId;
  }
  return null;
}

/**
 * An episode opens the day after the one before it was finished, on the learner's own calendar. It is
 * closed only while that day lasts, and never once the learner has started reading it.
 */
export function opensTomorrow(args: {
  previousCompletedAt: string | null | undefined;
  /** Parts of THIS episode already finished. */
  sectionsDone: number;
  todayISO: string;
  dayOf: (iso: string) => string;
}): boolean {
  const { previousCompletedAt, sectionsDone, todayISO, dayOf } = args;
  if (sectionsDone > 0 || !previousCompletedAt) return false;
  return dayOf(previousCompletedAt) === todayISO;
}

/** Whole seconds from `now` to `target` as HH:MM:SS, never below zero. */
export function countdown(target: number, now: number): string {
  const seconds = Math.max(0, Math.floor((target - now) / 1000));
  return [seconds / 3600, (seconds / 60) % 60, seconds % 60]
    .map((value) => String(Math.floor(value)).padStart(2, "0"))
    .join(":");
}

export interface StoredGuess {
  word: string;
  lead: string;
  sealedAt: string;
  revealed: boolean;
}

export function guessKey(userId: string, passageId: string): string {
  return `ss_series_guess:${userId}:${passageId}`;
}

/** A stored guess read back, or null for anything that is not one. */
export function parseGuess(raw: string | null): StoredGuess | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredGuess>;
    if (typeof value.word !== "string" || typeof value.lead !== "string") return null;
    return {
      word: value.word,
      lead: value.lead,
      sealedAt: typeof value.sealedAt === "string" ? value.sealedAt : "",
      revealed: value.revealed === true,
    };
  } catch {
    return null;
  }
}

/** The browser's storage may be closed (private window): then there is simply no stored guess. */
export function readGuess(userId: string, passageId: string): StoredGuess | null {
  try {
    return parseGuess(window.localStorage.getItem(guessKey(userId, passageId)));
  } catch {
    return null;
  }
}

export function writeGuess(userId: string, passageId: string, guess: StoredGuess): void {
  try {
    window.localStorage.setItem(guessKey(userId, passageId), JSON.stringify(guess));
  } catch {
    // Nothing to keep it in: the stage still plays through.
  }
}
