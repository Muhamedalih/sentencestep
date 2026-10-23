/**
 * Sentence bank: which lessons a learner finished and when. Pure — the loader hands in the learner's
 * completions (from their own progress) and a way to turn a timestamp into their calendar day.
 */

/** How many of the most recently finished lessons the loader reads sentences from; older lessons are reached only through sentences already on the learner's schedule. */
export const MAX_POOL_LESSONS = 40;

interface Completion {
  lessonId: string;
  mode: string;
  /** ISO timestamp of the completion. */
  completedAt: string;
}

/**
 * Lesson id → the learner-local day they finished it, for the daily lessons and stories they have
 * finished (the sentences of a conversation are lines to say, not to type back). A lesson that
 * appears twice keeps its earliest day: the sentences were known from then on.
 */
export function finishedLessonDays(
  completions: readonly Completion[],
  dayOf: (iso: string) => string,
): Map<string, string> {
  const days = new Map<string, string>();
  for (const completion of completions) {
    if (completion.mode !== "normal" && completion.mode !== "stories") continue;
    const day = dayOf(completion.completedAt);
    const known = days.get(completion.lessonId);
    if (known === undefined || day < known) days.set(completion.lessonId, day);
  }
  return days;
}

/** The lessons finished before `todayISO`, the most recently finished first (then by id, so the answer never depends on input order), at most `max`. */
export function recentFinishedLessons(
  finished: ReadonlyMap<string, string>,
  todayISO: string,
  max: number = MAX_POOL_LESSONS,
): string[] {
  return [...finished]
    .filter(([, day]) => day < todayISO)
    .sort(([idA, dayA], [idB, dayB]) => (dayA < dayB ? 1 : dayA > dayB ? -1 : idA < idB ? -1 : 1))
    .slice(0, Math.max(0, max))
    .map(([id]) => id);
}

/** At most this many of the lessons finished today are read for the day's exam; a learner who finished more still gets sentences from the first few. */
export const MAX_TODAY_LESSONS = 6;

/** The lessons the learner finished today (their own calendar day), in id order so the answer never depends on input order. */
export function finishedTodayLessons(
  finished: ReadonlyMap<string, string>,
  todayISO: string,
  max: number = MAX_TODAY_LESSONS,
): string[] {
  return [...finished]
    .filter(([, day]) => day === todayISO)
    .map(([id]) => id)
    .sort()
    .slice(0, Math.max(0, max));
}

/** How many sentences the learner was already asked back today. */
export function reviewedTodayCount(
  states: ReadonlyMap<string, { lastReviewedOn: string }>,
  todayISO: string,
): number {
  let count = 0;
  for (const state of states.values()) if (state.lastReviewedOn === todayISO) count += 1;
  return count;
}
