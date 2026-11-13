/**
 * Today's session of the Map tab (the wordsMap permission): four NEW words, each from a different
 * topic, picked from every Word Lists topic rather than from one. Pure, so the Map page (which shows
 * the four on its band) and the session route (which plays them) share the rule and the tests pin it.
 *
 * The rule, in this order:
 *  1. only words the learner has not met, from the level they are working in: the lowest level
 *     that is not yet 80% met (when every level is, any level);
 *  2. a topic the learner has begun comes before one they have not, and the closer it is to
 *     finished the sooner (a topic with two words left is finished first);
 *  3. inside that, the word that appears in more of the site's own lessons first, because it will be
 *     met again where the learner reads;
 *  4. one word from each topic, so the session mixes topics (similar words learned together are easy
 *     to confuse); only when fewer than four topics have words left does a topic give a second word.
 * Each picked word carries the reason it was picked, which the session screen says in one line.
 */

export const SESSION_SIZE = 4;
/** A level is "worked through" at this share of its words met. */
const LEVEL_DONE_RATIO = 0.8;

export interface PickGroup {
  id: string;
  level: number;
  order: number;
  wordIds: readonly string[];
}

export interface PickWord {
  id: string;
  groupId: string;
  word: string;
  order: number;
}

export type PickReason =
  | { kind: "finish"; left: number }
  | { kind: "seen"; lessons: number }
  | { kind: "continue"; done: number; total: number }
  | { kind: "start" };

export interface PickedWord {
  id: string;
  groupId: string;
  word: string;
  reason: PickReason;
}

export interface PickInput {
  groups: readonly PickGroup[];
  words: readonly PickWord[];
  /** Ids of the words the learner has met (Word Lists progress and the words bank together). */
  met: ReadonlySet<string>;
  /** In how many of the site's lessons a word appears, by its spelling; absent = 0. */
  lessonCount: ReadonlyMap<string, number>;
  size?: number;
}

/** The level the learner is working in: the lowest not yet worked through that still has a word to meet. */
export function workingLevel(
  groups: readonly PickGroup[],
  met: ReadonlySet<string>,
): number | null {
  const byLevel = new Map<number, { met: number; total: number }>();
  for (const group of groups) {
    const entry = byLevel.get(group.level) ?? { met: 0, total: 0 };
    for (const id of group.wordIds) {
      entry.total += 1;
      if (met.has(id)) entry.met += 1;
    }
    byLevel.set(group.level, entry);
  }
  const open = [...byLevel.entries()]
    .filter(([, entry]) => entry.met < entry.total)
    .sort((a, b) => a[0] - b[0]);
  if (open.length === 0) return null;
  const working = open.find(([, entry]) => entry.met / entry.total < LEVEL_DONE_RATIO);
  return (working ?? open[0]!)[0];
}

export function pickSession(input: PickInput): PickedWord[] {
  const size = input.size ?? SESSION_SIZE;
  const level = workingLevel(input.groups, input.met);
  if (level === null) return [];

  const groups = input.groups.filter((group) => group.level === level);
  const stats = new Map<string, { done: number; total: number; order: number }>();
  for (const group of groups) {
    let done = 0;
    for (const id of group.wordIds) if (input.met.has(id)) done += 1;
    stats.set(group.id, { done, total: group.wordIds.length, order: group.order });
  }

  const scored = input.words
    .filter((word) => stats.has(word.groupId) && !input.met.has(word.id))
    .map((word) => {
      const stat = stats.get(word.groupId)!;
      const lessons = input.lessonCount.get(word.word) ?? 0;
      const began = stat.done > 0;
      const left = stat.total - stat.done;
      const closeness = began ? 100 * (stat.done / stat.total) + (left <= 2 ? 50 : 0) : 0;
      const score = closeness + 10 * Math.log2(1 + lessons);
      const reason: PickReason =
        began && left <= 2
          ? { kind: "finish", left }
          : lessons >= 2
            ? { kind: "seen", lessons }
            : began
              ? { kind: "continue", done: stat.done, total: stat.total }
              : { kind: "start" };
      return { word, score, order: stat.order, reason };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.order - b.order ||
        a.word.order - b.word.order ||
        a.word.word.localeCompare(b.word.word),
    );

  const picked: typeof scored = [];
  const usedTopics = new Set<string>();
  for (const item of scored) {
    if (picked.length >= size) break;
    if (usedTopics.has(item.word.groupId)) continue;
    usedTopics.add(item.word.groupId);
    picked.push(item);
  }
  // Fewer topics than words wanted: the best words left, from the topics already in.
  for (const item of scored) {
    if (picked.length >= size) break;
    if (!picked.includes(item)) picked.push(item);
  }
  return picked.map(({ word, reason }) => ({
    id: word.id,
    groupId: word.groupId,
    word: word.word,
    reason,
  }));
}

/** In how many lessons each word appears, from the lessons' word index (lesson id -> its words). */
export function lessonCounts(
  lessons: Readonly<Record<string, readonly string[]>>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const list of Object.values(lessons)) {
    for (const word of new Set(list)) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}
