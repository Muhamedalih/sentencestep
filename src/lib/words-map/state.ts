/**
 * The Map tab of the Words page («الخريطة», the wordsMap permission): what state each Word Lists word is
 * in for a learner, and the figures the map draws from it. Pure and client-safe: the server hands the
 * browser the learner's bank shelves, the browser adds the Word Lists progress it already holds (a
 * guest's lives in the browser, a signed-in learner's comes from their account).
 *
 * A word is in one of four states, worked out from what the learner already has, never stored:
 *  - stable    the words bank holds it and it has left the daily round for good («ثابتة»)
 *  - settling  the words bank is working on it («قيد التثبيت»)
 *  - new       met: typed right in a Word Lists round, or waiting in the bank's queue («جديدة»)
 *  - unseen    neither («لم تُرَ»)
 */

export const MAP_STATES = ["unseen", "new", "settling", "stable"] as const;
export type MapWordState = (typeof MAP_STATES)[number];

/** The bank's own three shelves, by the word's spelling (see word-bank/shelves.ts). */
export type BankShelfName = "stable" | "active" | "waiting";
export type BankShelfMap = Readonly<Record<string, BankShelfName>>;

/** One word as the map's list shows it (kept short: the whole catalog is sent to the browser). */
export interface MapWord {
  id: string;
  /** The topic's id. */
  g: string;
  /** The word, lowercase. */
  w: string;
  /** Its short meaning in the learner's support language. */
  m: string;
}

export interface MapGroup {
  id: string;
  level: number;
  order: number;
  wordIds: readonly string[];
}

export function wordState(
  word: Pick<MapWord, "id" | "w">,
  shelf: BankShelfMap,
  completed: ReadonlySet<string>,
): MapWordState {
  const on = shelf[word.w];
  if (on === "stable") return "stable";
  if (on === "active") return "settling";
  if (on === "waiting") return "new";
  return completed.has(word.id) ? "new" : "unseen";
}

export interface StateCounts {
  stable: number;
  settling: number;
  new: number;
  unseen: number;
  /** stable + settling + new: every word the learner has met. */
  met: number;
  total: number;
}

const emptyCounts = (): StateCounts => ({
  stable: 0,
  settling: 0,
  new: 0,
  unseen: 0,
  met: 0,
  total: 0,
});

function add(into: StateCounts, state: MapWordState): void {
  into[state] += 1;
  into.total += 1;
  if (state !== "unseen") into.met += 1;
}

export interface MapFigures {
  all: StateCounts;
  byTopic: Map<string, StateCounts>;
  byLevel: Map<number, StateCounts>;
  stateOf: Map<string, MapWordState>;
}

export function summarizeMap(
  groups: readonly MapGroup[],
  words: readonly MapWord[],
  shelf: BankShelfMap,
  completed: ReadonlySet<string>,
): MapFigures {
  const levelOf = new Map(groups.map((group) => [group.id, group.level]));
  const all = emptyCounts();
  const byTopic = new Map<string, StateCounts>();
  const byLevel = new Map<number, StateCounts>();
  const stateOf = new Map<string, MapWordState>();
  for (const word of words) {
    const state = wordState(word, shelf, completed);
    stateOf.set(word.id, state);
    add(all, state);
    const topic = byTopic.get(word.g) ?? emptyCounts();
    add(topic, state);
    byTopic.set(word.g, topic);
    const level = levelOf.get(word.g);
    if (level !== undefined) {
      const counts = byLevel.get(level) ?? emptyCounts();
      add(counts, state);
      byLevel.set(level, counts);
    }
  }
  return { all, byTopic, byLevel, stateOf };
}

export type ListFilter = MapWordState | "all";

export interface ListOptions {
  query: string;
  filter: ListFilter;
  /** 0 = every level. */
  level: number;
  /** Words to put first (today's session), in this order. */
  firstIds?: readonly string[];
}

/** The order of the list: today's words, then the ones being settled, new, stable and last the unseen. */
const RANK: Record<MapWordState, number> = { settling: 1, new: 2, stable: 3, unseen: 4 };

export function listWords(
  words: readonly MapWord[],
  groups: readonly MapGroup[],
  stateOf: ReadonlyMap<string, MapWordState>,
  options: ListOptions,
): MapWord[] {
  const levelOf = new Map(groups.map((group) => [group.id, group.level]));
  const order = new Map(groups.map((group) => [group.id, group.order]));
  const query = options.query.trim().toLowerCase();
  const first = new Map((options.firstIds ?? []).map((id, index) => [id, index]));
  const picked = words.filter((word) => {
    if (options.level !== 0 && levelOf.get(word.g) !== options.level) return false;
    if (options.filter !== "all" && stateOf.get(word.id) !== options.filter) return false;
    if (query && !word.w.includes(query) && !word.m.toLowerCase().includes(query)) return false;
    return true;
  });
  const rank = (word: MapWord) =>
    first.has(word.id) ? -1 : RANK[stateOf.get(word.id) ?? "unseen"];
  return picked.sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (first.get(a.id) ?? 0) - (first.get(b.id) ?? 0) ||
      (order.get(a.g) ?? 0) - (order.get(b.g) ?? 0) ||
      a.w.localeCompare(b.w),
  );
}
