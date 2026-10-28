import type { LessonUnit } from "@/types/content";

/** What a lesson on the Path looks like to the learner. */
export type PathState = "done" | "current" | "locked" | "open";

export interface PathStation {
  lesson: LessonUnit;
  state: PathState;
}

/**
 * The stations of one level, in order. A finished lesson is "done"; the lesson the learner should
 * do now is "current" (see findCurrentLesson); a lesson past the free ones is "locked" for a learner
 * without a subscription; everything else is "open". Done wins over locked, so a lesson the learner
 * finished before a plan ended still reads as finished.
 */
export function pathStations(
  lessons: readonly LessonUnit[],
  completedIds: readonly string[],
  currentId: string | undefined,
  isPremiumUser: boolean,
): PathStation[] {
  return lessons.map((lesson) => {
    if (completedIds.includes(lesson.id)) return { lesson, state: "done" };
    if (lesson.id === currentId) return { lesson, state: "current" };
    if (!lesson.isFree && !isPremiumUser) return { lesson, state: "locked" };
    return { lesson, state: "open" };
  });
}

/**
 * The stations before and after the current one, so the view can draw the current lesson as the
 * large card between them. Without a current station everything is "before".
 */
export function splitAroundCurrent(stations: readonly PathStation[]): {
  before: PathStation[];
  current: PathStation | undefined;
  after: PathStation[];
} {
  const index = stations.findIndex((station) => station.state === "current");
  if (index === -1) return { before: [...stations], current: undefined, after: [] };
  return {
    before: stations.slice(0, index),
    current: stations[index],
    after: stations.slice(index + 1),
  };
}

/** How many stations of a level are finished. */
export function countDone(stations: readonly PathStation[]): number {
  return stations.filter((station) => station.state === "done").length;
}
