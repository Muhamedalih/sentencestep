/**
 * The maths of the Word Lists readout (scripts/words-readout.ts): who typed words in the published
 * topic lists, how deep they went, whether they came back, how far a list's learners get, what the
 * weak-word ledger looks like and how the new WORDS_ROUND events came out. Pure, so it is tested;
 * nothing here reads the database.
 *
 * Days are UTC calendar days ("YYYY-MM-DD"), as in the other readouts (see returns.ts). A word's
 * `created_at` is the moment it was first typed right and its `completed_at` the last time it was
 * typed again, so the days with NEW words are a minimum of the days a learner used the section.
 */

import { DAY_MS, addDays, utcDay } from "@/lib/readout/returns";

// ---- The fixed date a run is read at. ----

export interface AsOf {
  /** Everything strictly before this instant counts. */
  cutoffMs: number;
  /** The last UTC day that counts, "YYYY-MM-DD". */
  day: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `--as-of`: a date ("2026-10-26") counts through the END of that UTC day, so the same date always
 * gives the same figures once the day is over; a full instant ("2026-10-26T20:00:00Z") counts what
 * is before it. Null for anything else (a date that does not exist, no value).
 */
export function parseAsOf(value: string | undefined): AsOf | null {
  if (!value) return null;
  if (DATE_ONLY.test(value)) {
    const start = Date.parse(`${value}T00:00:00Z`);
    if (Number.isNaN(start) || utcDay(start) !== value) return null;
    return { cutoffMs: start + DAY_MS, day: value };
  }
  if (!value.includes("T")) return null;
  const instant = Date.parse(value);
  return Number.isNaN(instant) ? null : { cutoffMs: instant, day: utcDay(instant - 1) };
}

// ---- Small statistics. ----

export interface Distribution {
  n: number;
  mean: number;
  median: number;
  /** The value the 90th percent of learners are at or below (nearest rank: the top 10% are at or above it). */
  p90: number;
}

export function distribution(values: readonly number[]): Distribution | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const middle = n >> 1;
  return {
    n,
    mean: sorted.reduce((sum, value) => sum + value, 0) / n,
    median: n % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2,
    p90: sorted[Math.min(n - 1, Math.floor(0.9 * n))]!,
  };
}

/** The ranges the strategy report counts words per learner in. */
export const WORD_COUNT_BUCKETS = [
  { label: "1-5", max: 5 },
  { label: "6-10", max: 10 },
  { label: "11-20", max: 20 },
  { label: "21-50", max: 50 },
  { label: "51-100", max: 100 },
  { label: "101+", max: Number.POSITIVE_INFINITY },
] as const;

export function bucketCounts(values: readonly number[]): { label: string; count: number }[] {
  const counts = WORD_COUNT_BUCKETS.map((bucket) => ({ label: bucket.label, count: 0 }));
  for (const value of values) {
    const at = WORD_COUNT_BUCKETS.findIndex((bucket) => value <= bucket.max);
    if (at >= 0) counts[at]!.count += 1;
  }
  return counts;
}

// ---- Who typed what, and when. ----

/** One word a learner typed right: its list, when it was first typed and when it was last typed again (the same moment when never repeated). */
export interface TypedWord {
  userId: string;
  groupId: string;
  firstMs: number;
  lastMs: number;
}

/** Everything one learner did in the lists, up to the cutoff. */
export interface LearnerUse {
  /** Distinct words typed right. */
  words: number;
  /** Words per list. */
  perGroup: Map<string, number>;
  /** UTC days on which a word was typed right for the first time. */
  newDays: Set<string>;
  /** Typing events per UTC day: a word counts on the day it was first typed and, when that is another day, again on the day it was last typed. */
  eventsByDay: Map<string, number>;
  firstMs: number;
}

/** A learner's use up to `cutoffMs`; a word first typed after it is not there, and a re-type after it (which overwrote the earlier time) is not counted. */
export function learnerUses(
  words: readonly TypedWord[],
  cutoffMs: number,
): Map<string, LearnerUse> {
  const uses = new Map<string, LearnerUse>();
  for (const word of words) {
    if (word.firstMs >= cutoffMs) continue;
    let use = uses.get(word.userId);
    if (!use) {
      use = {
        words: 0,
        perGroup: new Map(),
        newDays: new Set(),
        eventsByDay: new Map(),
        firstMs: word.firstMs,
      };
      uses.set(word.userId, use);
    }
    use.words += 1;
    use.perGroup.set(word.groupId, (use.perGroup.get(word.groupId) ?? 0) + 1);
    use.firstMs = Math.min(use.firstMs, word.firstMs);
    const firstDay = utcDay(word.firstMs);
    use.newDays.add(firstDay);
    use.eventsByDay.set(firstDay, (use.eventsByDay.get(firstDay) ?? 0) + 1);
    if (word.lastMs < cutoffMs) {
      const lastDay = utcDay(word.lastMs);
      if (lastDay !== firstDay)
        use.eventsByDay.set(lastDay, (use.eventsByDay.get(lastDay) ?? 0) + 1);
    }
  }
  return uses;
}

export interface WindowUse {
  learners: number;
  /** Words typed or typed again inside the window, each counted once. */
  words: number;
  perLearner: Distribution | null;
}

/** Who was active in the window (`fromMs`, `cutoffMs`), a word counting when it was first typed or last typed again inside it. `fromMs` null = from the start. */
export function windowUse(
  words: readonly TypedWord[],
  fromMs: number | null,
  cutoffMs: number,
): WindowUse {
  const perLearner = new Map<string, number>();
  const inside = (ms: number) => ms < cutoffMs && (fromMs === null || ms > fromMs);
  let total = 0;
  for (const word of words) {
    if (!inside(word.firstMs) && !inside(word.lastMs)) continue;
    total += 1;
    perLearner.set(word.userId, (perLearner.get(word.userId) ?? 0) + 1);
  }
  return {
    learners: perLearner.size,
    words: total,
    perLearner: distribution([...perLearner.values()]),
  };
}

// ---- How deep. ----

export interface DepthSummary {
  learners: number;
  words: Distribution;
  buckets: { label: string; count: number }[];
  /** Days with NEW words per learner: the mean, and how many typed on exactly one, two or more, three or more days. */
  newDays: { mean: number; one: number; twoPlus: number; threePlus: number };
  /** Lists touched per learner, the same way. */
  lists: { mean: number; one: number; twoPlus: number; threePlus: number };
  /** Typing events per learner per day of use (every day with a first typing or a last re-typing). */
  useDay: Distribution | null;
}

function countShape(values: readonly number[]) {
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    one: values.filter((value) => value === 1).length,
    twoPlus: values.filter((value) => value >= 2).length,
    threePlus: values.filter((value) => value >= 3).length,
  };
}

export function depthSummary(uses: ReadonlyMap<string, LearnerUse>): DepthSummary | null {
  const all = [...uses.values()];
  const words = distribution(all.map((use) => use.words));
  if (!words) return null;
  return {
    learners: all.length,
    words,
    buckets: bucketCounts(all.map((use) => use.words)),
    newDays: countShape(all.map((use) => use.newDays.size)),
    lists: countShape(all.map((use) => use.perGroup.size)),
    useDay: distribution(all.flatMap((use) => [...use.eventsByDay.values()])),
  };
}

// ---- Coming back, and a list's funnel. ----

/**
 * Of the learners who started the section at least `minDaysAgo` days before the as-of day (so their
 * first week is over), how many typed NEW words on another day than their first. The strategy
 * report's "came back to the section" (18.8% on 26 Oct 2026).
 */
export function comeBack(
  uses: ReadonlyMap<string, LearnerUse>,
  asOfDay: string,
  minDaysAgo = 8,
): { pool: number; back: number } {
  const startedBy = addDays(asOfDay, -minDaysAgo);
  let pool = 0;
  let back = 0;
  for (const use of uses.values()) {
    if (utcDay(use.firstMs) > startedBy) continue;
    pool += 1;
    if (use.newDays.size >= 2) back += 1;
  }
  return { pool, back };
}

/** Learners who typed at least one word of the list, and how many of those typed nothing in any other list. */
export function touchedGroup(
  uses: ReadonlyMap<string, LearnerUse>,
  groupId: string,
): { touched: number; onlyThis: number } {
  let touched = 0;
  let onlyThis = 0;
  for (const use of uses.values()) {
    if (!use.perGroup.has(groupId)) continue;
    touched += 1;
    if (use.perGroup.size === 1) onlyThis += 1;
  }
  return { touched, onlyThis };
}

/** Learners who typed every word of at least one list (`sizes`: the number of words in each). */
export function finishedAnyList(
  uses: ReadonlyMap<string, LearnerUse>,
  sizes: ReadonlyMap<string, number>,
): number {
  let finished = 0;
  for (const use of uses.values()) {
    for (const [groupId, typed] of use.perGroup) {
      const size = sizes.get(groupId);
      if (size !== undefined && size > 0 && typed >= size) {
        finished += 1;
        break;
      }
    }
  }
  return finished;
}

export interface GroupFunnel {
  /** Learners who typed at least one word of the list. */
  started: number;
  /** How many of them got to at least this many words. */
  reached: { words: number; learners: number }[];
  /** Learners who typed the whole list, and how many of those also typed a word of another list. */
  finished: number;
  finishedAlsoOther: number;
}

/** How far the learners who started a list get through it: the steps the strategy report gives, ending with the whole list. */
export function groupFunnel(
  uses: ReadonlyMap<string, LearnerUse>,
  groupId: string,
  size: number,
  steps: readonly number[] = [1, 5, 10, 15, 20],
): GroupFunnel {
  const wanted = [...new Set([...steps.filter((step) => step < size), size])].sort((a, b) => a - b);
  const funnel: GroupFunnel = {
    started: 0,
    reached: wanted.map((words) => ({ words, learners: 0 })),
    finished: 0,
    finishedAlsoOther: 0,
  };
  for (const use of uses.values()) {
    const typed = use.perGroup.get(groupId);
    if (!typed) continue;
    funnel.started += 1;
    for (const step of funnel.reached) if (typed >= step.words) step.learners += 1;
    if (typed >= size) {
      funnel.finished += 1;
      if (use.perGroup.size > 1) funnel.finishedAlsoOther += 1;
    }
  }
  return funnel;
}

/** How long after signing up the learners first typed a word (`signedUpMs`: the account's creation time, by learner). */
export function startTiming(
  uses: ReadonlyMap<string, LearnerUse>,
  signedUpMs: ReadonlyMap<string, number>,
): { known: number; within1h: number; within24h: number; after7d: number } {
  const timing = { known: 0, within1h: 0, within24h: 0, after7d: 0 };
  for (const [userId, use] of uses) {
    const signedUp = signedUpMs.get(userId);
    if (signedUp === undefined) continue;
    const gap = use.firstMs - signedUp;
    timing.known += 1;
    if (gap <= 3_600_000) timing.within1h += 1;
    if (gap <= DAY_MS) timing.within24h += 1;
    if (gap > 7 * DAY_MS) timing.after7d += 1;
  }
  return timing;
}

// ---- The weak-word ledger: mistakes with no sentence (a word missed in the Word Lists). ----

export interface LedgerRow {
  user_id: string;
  status: string;
  created_at: string;
  corrected_at: string | null;
  review_stage: number;
  next_review_at: string | null;
}

export interface LedgerStats {
  /** Words missed (one row per learner and word), and how many learners missed any. */
  words: number;
  learners: number;
  corrected: number;
  /** Not corrected yet, and the learners who have such words. */
  open: number;
  openLearners: number;
  /** Median minutes from the first miss to the correction, over the corrected words that say when. */
  medianMinutesToCorrect: number | null;
  /** Words on the review schedule (a stage reached or a next review set): the word lists never put one there. */
  scheduled: number;
  /** Median age in days of the open words, from the first miss to the cutoff, and how many are older than three days. */
  openMedianAgeDays: number | null;
  openOlderThan3Days: number;
}

/**
 * The ledger as read now, for the words first missed before the cutoff. The table is live (a word
 * missed or corrected after the cutoff has changed its row), so for a date long past the open and
 * corrected split is today's, not that day's.
 */
export function ledgerStats(rows: readonly LedgerRow[], cutoffMs: number): LedgerStats {
  const learners = new Set<string>();
  const openLearners = new Set<string>();
  const minutes: number[] = [];
  const openAges: number[] = [];
  let words = 0;
  let corrected = 0;
  let open = 0;
  let scheduled = 0;
  for (const row of rows) {
    const createdMs = Date.parse(row.created_at);
    if (Number.isNaN(createdMs) || createdMs >= cutoffMs) continue;
    words += 1;
    learners.add(row.user_id);
    if (row.review_stage >= 1 || row.next_review_at !== null) scheduled += 1;
    if (row.status === "corrected") {
      corrected += 1;
      const correctedMs = row.corrected_at === null ? NaN : Date.parse(row.corrected_at);
      if (!Number.isNaN(correctedMs)) minutes.push((correctedMs - createdMs) / 60_000);
    } else {
      open += 1;
      openLearners.add(row.user_id);
      openAges.push((cutoffMs - createdMs) / DAY_MS);
    }
  }
  const median = (values: number[]) => distribution(values)?.median ?? null;
  return {
    words,
    learners: learners.size,
    corrected,
    open,
    openLearners: openLearners.size,
    medianMinutesToCorrect: median(minutes),
    scheduled,
    openMedianAgeDays: median(openAges),
    openOlderThan3Days: openAges.filter((age) => age > 3).length,
  };
}

// ---- The WORDS_ROUND events. ----

export interface RoundEventRow {
  user_id: string | null;
  event_name: string;
  event_properties: unknown;
}

export interface RoundSourceStats {
  source: string;
  started: number;
  finished: number;
  /** Words asked in the finished rounds, and how their first answers went. */
  asked: number;
  clean: number;
  assisted: number;
  missed: number;
  /** Signed-in learners who started a round (distinct), and starts with no account. */
  learners: number;
  guestStarts: number;
}

function numberOf(properties: unknown, key: string): number {
  if (typeof properties !== "object" || properties === null) return 0;
  const value = (properties as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringOf(properties: unknown, key: string): string | null {
  if (typeof properties !== "object" || properties === null) return null;
  const value = (properties as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

/**
 * The WORDS_ROUND_STARTED / WORDS_ROUND_FINISHED events per source. A row of a signed-in account
 * that is not a learner (an admin or an editor testing) is left out; a row with no account is a
 * guest's and counts. Sources come out in the order the events first show them.
 */
export function roundStats(
  events: readonly RoundEventRow[],
  isLearner: (userId: string) => boolean,
): RoundSourceStats[] {
  const bySource = new Map<string, RoundSourceStats & { learnerIds: Set<string> }>();
  for (const event of events) {
    if (event.event_name !== "WORDS_ROUND_STARTED" && event.event_name !== "WORDS_ROUND_FINISHED") {
      continue;
    }
    if (event.user_id !== null && !isLearner(event.user_id)) continue;
    const source = stringOf(event.event_properties, "source");
    if (source === null) continue;
    let stats = bySource.get(source);
    if (!stats) {
      stats = {
        source,
        started: 0,
        finished: 0,
        asked: 0,
        clean: 0,
        assisted: 0,
        missed: 0,
        learners: 0,
        guestStarts: 0,
        learnerIds: new Set(),
      };
      bySource.set(source, stats);
    }
    if (event.event_name === "WORDS_ROUND_STARTED") {
      stats.started += 1;
      if (event.user_id === null) stats.guestStarts += 1;
      else stats.learnerIds.add(event.user_id);
    } else {
      stats.finished += 1;
      stats.asked += numberOf(event.event_properties, "count");
      stats.clean += numberOf(event.event_properties, "clean");
      stats.assisted += numberOf(event.event_properties, "assisted");
      stats.missed += numberOf(event.event_properties, "missed");
    }
  }
  return [...bySource.values()].map(({ learnerIds, ...stats }) => ({
    ...stats,
    learners: learnerIds.size,
  }));
}
