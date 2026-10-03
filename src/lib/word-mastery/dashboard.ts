import { STRONG_STRENGTH } from "@/lib/word-mastery/schedule";
import type { GroupMastery, MasteryState } from "@/lib/word-mastery/schedule";

/**
 * What the redesigned Word Lists screens (mastery rings, the word wall, ranks)
 * show, derived from the same schedule everything else reads. Pure and
 * client-safe: no server imports, so the rings, the wall and the unit tests
 * share one set of rules.
 *
 * Three bands, one meaning each:
 *  - new: the learner has never met the word (no schedule row).
 *  - learning: met, but not strong yet (strength 1 to STRONG_STRENGTH - 1, or 0
 *    after a miss).
 *  - mastered: strength STRONG_STRENGTH or more — the same "strong" the library
 *    already counts (the 16-day review passed).
 */

export const WORD_BANDS = ["new", "learning", "mastered"] as const;
export type WordBand = (typeof WORD_BANDS)[number];

export interface Bands {
  total: number;
  new: number;
  learning: number;
  mastered: number;
}

export function bandOf(state: MasteryState | null | undefined): WordBand {
  if (!state) return "new";
  return state.strength >= STRONG_STRENGTH ? "mastered" : "learning";
}

/** The three bands of a list of words, from the learner's schedule. */
export function summarizeBands(
  wordIds: readonly string[],
  states: ReadonlyMap<string, MasteryState>,
): Bands {
  const bands: Bands = { total: wordIds.length, new: 0, learning: 0, mastered: 0 };
  for (const id of wordIds) bands[bandOf(states.get(id))] += 1;
  return bands;
}

/** The bands of an already-summarized group (what the library page computes on the server). */
export function bandsFromGroupMastery(mastery: GroupMastery): Bands {
  const mastered = Math.min(mastery.strongCount, mastery.doneCount);
  return {
    total: mastery.total,
    new: mastery.newCount,
    learning: Math.max(0, mastery.doneCount - mastered),
    mastered,
  };
}

/**
 * The bands when there is no schedule to read (a guest, or Smart word practice
 * off): the only thing known is how many words the learner has typed right at
 * least once, which is "learning" — nothing can be called mastered without a
 * schedule, and saying so would be a guess.
 */
export function bandsFromCompleted(total: number, completedCount: number): Bands {
  const learning = Math.min(Math.max(0, Math.trunc(completedCount)), total);
  return { total, new: total - learning, learning, mastered: 0 };
}

export function sumBands(list: readonly Bands[]): Bands {
  return list.reduce<Bands>(
    (sum, bands) => ({
      total: sum.total + bands.total,
      new: sum.new + bands.new,
      learning: sum.learning + bands.learning,
      mastered: sum.mastered + bands.mastered,
    }),
    { total: 0, new: 0, learning: 0, mastered: 0 },
  );
}

/** Whole-number share of the words that are mastered, 0-100. */
export function masteredPercent(bands: Bands): number {
  return bands.total === 0 ? 0 : Math.round((bands.mastered / bands.total) * 100);
}

/**
 * The three arcs of a mastery ring as fractions of the full circle (they add up
 * to 1 when there are words, to 0 when there are none): mastered first, then
 * learning, then new — the order the ring is drawn clockwise from the top.
 */
export function ringFractions(bands: Bands): { mastered: number; learning: number; new: number } {
  if (bands.total === 0) return { mastered: 0, learning: 0, new: 0 };
  return {
    mastered: bands.mastered / bands.total,
    learning: bands.learning / bands.total,
    new: bands.new / bands.total,
  };
}

/** Mastery ranks, lowest to highest. "none" until the first threshold is reached. */
export const MASTERY_RANKS = ["none", "bronze", "silver", "gold"] as const;
export type MasteryRank = (typeof MASTERY_RANKS)[number];

/** The share of a topic's words that must be mastered for each rank. A rank is earned by what the learner remembers, not by what they have clicked through. */
export const RANK_THRESHOLDS = { bronze: 25, silver: 60, gold: 90 } as const;

export function rankFor(bands: Bands): MasteryRank {
  if (bands.total === 0) return "none";
  const percent = (bands.mastered / bands.total) * 100;
  if (percent >= RANK_THRESHOLDS.gold) return "gold";
  if (percent >= RANK_THRESHOLDS.silver) return "silver";
  if (percent >= RANK_THRESHOLDS.bronze) return "bronze";
  return "none";
}

/** The next rank up and how many more mastered words reach it, or null at gold (or with no words). */
export function nextRank(
  bands: Bands,
): { rank: Exclude<MasteryRank, "none">; wordsToGo: number } | null {
  if (bands.total === 0) return null;
  const current = rankFor(bands);
  const next = MASTERY_RANKS[MASTERY_RANKS.indexOf(current) + 1];
  if (!next || next === "none") return null;
  const needed = Math.ceil((RANK_THRESHOLDS[next] / 100) * bands.total);
  return { rank: next, wordsToGo: Math.max(0, needed - bands.mastered) };
}

/** A word at or below this strength is "weak": met, but it has not stuck (new after a miss, or one clean answer). */
export const WEAK_STRENGTH = 2;

export function isWeak(state: MasteryState | null | undefined): boolean {
  return !!state && state.strength <= WEAK_STRENGTH;
}

/**
 * "Practice the weak ones only": the group's words the learner has met but not
 * secured, weakest first (then the longest overdue, then the group's own order).
 * A word they have never met is not weak — it is new, and Continue covers it.
 */
export function selectWeakWords<T extends { id: string }>(
  words: readonly T[],
  states: ReadonlyMap<string, MasteryState>,
): T[] {
  return words
    .map((word, index) => ({ word, index, state: states.get(word.id) }))
    .filter((entry): entry is { word: T; index: number; state: MasteryState } =>
      isWeak(entry.state),
    )
    .sort(
      (a, b) =>
        a.state.strength - b.state.strength ||
        (a.state.dueOn < b.state.dueOn ? -1 : a.state.dueOn > b.state.dueOn ? 1 : 0) ||
        a.index - b.index,
    )
    .map((entry) => entry.word);
}

/** The strength shown as filled pips on a word tile: 0-5 (MAX_STRENGTH), clamped. */
export function strengthPips(state: MasteryState | null | undefined, max = 5): number {
  if (!state) return 0;
  return Math.min(max, Math.max(0, Math.trunc(state.strength)));
}

/** Splits a list into batches of `size` (the last one may be shorter). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) throw new Error("size must be at least 1");
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}
