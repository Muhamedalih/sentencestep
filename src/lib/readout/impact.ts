import { DAY_MS } from "@/lib/readout/returns";

/**
 * The maths of the before / after readout of Today's session (scripts/today-impact-readout.ts):
 * once the daily tasks were open to everyone, did learners stay longer, come back more, and try
 * to subscribe more? Pure, so it is tested; nothing here reads or writes the database.
 *
 * Time is cut into 24-hour WINDOWS that start at the moment the change went live: window 0 is the
 * first 24 hours after it, window -1 the 24 hours before it. The change sits exactly on a
 * boundary, so there is no half-and-half launch day, and each window holds the same hours of the
 * day (a UTC calendar day would split the launch day and mix other hours into each side).
 *
 * Every measure is a Series: one (numerator, denominator) cell per window. `compareSeries` sets
 * the windows before against the complete windows after, and says whether the difference is
 * bigger than the usual swing between ordinary windows. It describes; it never proves: this is a
 * before / after reading with no control group, and other things change in the same weeks.
 */

export const MINUTE_MS = 60_000;
export const WINDOW_MS = DAY_MS;

export function windowIndex(ms: number, originMs: number): number {
  return Math.floor((ms - originMs) / WINDOW_MS);
}

export function windowStart(k: number, originMs: number): number {
  return originMs + k * WINDOW_MS;
}

export interface WindowPlan {
  /** -beforeWindows .. -1. */
  beforeKs: number[];
  /** The windows after the change that are over. */
  afterKs: number[];
  /** The window still running, if any: shown, never counted. */
  partialK: number | null;
}

export function windowPlan(originMs: number, nowMs: number, beforeWindows: number): WindowPlan {
  const beforeKs: number[] = [];
  for (let k = -beforeWindows; k < 0; k++) beforeKs.push(k);
  const afterKs: number[] = [];
  let partialK: number | null = null;
  for (let k = 0; windowStart(k, originMs) < nowMs; k++) {
    if (windowStart(k + 1, originMs) <= nowMs) afterKs.push(k);
    else partialK = k;
  }
  return { beforeKs, afterKs, partialK };
}

// --- Time spent: events -> blocks of continuous activity -------------------------------------

export interface Span {
  start: number;
  end: number;
}

/** Events closer together than this belong to one stretch of continuous activity. */
export const BLOCK_BRIDGE_MS = 4 * MINUTE_MS;
/** A lone event (nothing to measure a length by) counts for one minute. */
export const LONE_EVENT_MS = MINUTE_MS;
/** A start with no completion within this long is not one sitting, whatever the events say. */
export const MAX_LESSON_MS = 40 * MINUTE_MS;
/** Blocks closer together than this are the same visit; after a longer pause it is a new one. */
export const VISIT_GAP_MS = 30 * MINUTE_MS;

/**
 * One learner's spans as blocks of continuous activity: spans (or lone events) less than
 * BLOCK_BRIDGE_MS apart are one block. The database has no durations, so a block's length is an
 * ESTIMATE: read it as an index (before against after), never as exact minutes.
 */
export function mergeBlocks(spans: readonly Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const blocks: Span[] = [];
  for (const span of sorted) {
    const end = span.end > span.start ? span.end : span.start + LONE_EVENT_MS;
    const last = blocks[blocks.length - 1];
    if (last && span.start - last.end <= BLOCK_BRIDGE_MS) last.end = Math.max(last.end, end);
    else blocks.push({ start: span.start, end });
  }
  return blocks;
}

export interface LessonEvent {
  userId: string;
  lessonId: string;
  at: number;
  type: "start" | "complete";
}

export interface PairedLessons {
  /** One span per completion: from its start when one was found, else a single event. */
  spans: { userId: string; start: number; end: number }[];
  /** Starts no completion ever followed: the learner was there, for how long is unknown. */
  openStarts: { userId: string; at: number }[];
}

/**
 * Pairs each completion with the latest unused start of the same lesson by the same learner,
 * within MAX_LESSON_MS: a lesson opened at 10:00 and finished at 10:06 is a six-minute span.
 */
export function pairLessonEvents(events: readonly LessonEvent[]): PairedLessons {
  const groups = new Map<string, LessonEvent[]>();
  for (const event of events) {
    const key = `${event.userId}|${event.lessonId}`;
    let list = groups.get(key);
    if (!list) groups.set(key, (list = []));
    list.push(event);
  }
  const spans: PairedLessons["spans"] = [];
  const openStarts: PairedLessons["openStarts"] = [];
  for (const list of groups.values()) {
    list.sort((a, b) => a.at - b.at);
    const open: number[] = [];
    for (const event of list) {
      if (event.type === "start") {
        open.push(event.at);
        continue;
      }
      let found = -1;
      for (let i = open.length - 1; i >= 0; i--) {
        if (event.at - (open[i] ?? 0) <= MAX_LESSON_MS) {
          found = i;
          break;
        }
      }
      if (found >= 0) {
        spans.push({ userId: event.userId, start: open[found] ?? event.at, end: event.at });
        open.splice(found, 1);
      } else {
        spans.push({ userId: event.userId, start: event.at, end: event.at });
      }
    }
    const first = list[0];
    if (first) for (const at of open) openStarts.push({ userId: first.userId, at });
  }
  return { spans, openStarts };
}

// --- The input ---------------------------------------------------------------------------------

export interface LearnerRecord {
  id: string;
  createdAt: number;
}

/** Something a learner did that counts as studying (a lesson, a passage, a word, a review). */
export interface Moment {
  userId: string;
  start: number;
  /** Equal to `start` for a single event. */
  end: number;
}

/** A sign that a learner was around without studying: Home opened, a lock seen. */
export interface Presence {
  userId: string;
  at: number;
}

export type LockKind = "lesson" | "story" | "wordList" | "passage";
export interface LockSeen {
  /** Null for a visitor who has not signed up. */
  userId: string | null;
  at: number;
  kind: LockKind;
}

export interface UserAt {
  userId: string | null;
  at: number;
}

export type UnitKind = "lesson" | "story" | "passage" | "word";
export interface UnitDone {
  userId: string;
  at: number;
  kind: UnitKind;
}

export interface OrderRecord {
  userId: string;
  provider: string;
  createdAt: number;
  paidAt: number | null;
}

export type TaskKind = "old" | "today";
export interface TaskRecord {
  userId: string;
  kind: TaskKind;
  /** The slot of the row: Today's listen / story / words are 10, 11, 12. */
  slot: number;
  createdAt: number;
  done: boolean;
}

export interface ImpactInput {
  /** The moment the change went live: the start of window 0. */
  originMs: number;
  /** The end of the data. The window it falls in is still running. */
  nowMs: number;
  /** The first moment the activity data covers: a window needing earlier data is not judged. */
  dataStartMs: number;
  /** How many windows before the change to compare with. */
  beforeWindows: number;
  /** Learners only (no admins). */
  learners: readonly LearnerRecord[];
  moments: readonly Moment[];
  presence: readonly Presence[];
  locks: readonly LockSeen[];
  upgradeViews: readonly UserAt[];
  payPresses: readonly UserAt[];
  units: readonly UnitDone[];
  orders: readonly OrderRecord[];
  tasks: readonly TaskRecord[];
  /** Learners who reached the finish screen of Today's session. */
  finishedToday: readonly UserAt[];
}

// --- The output --------------------------------------------------------------------------------

export interface Cell {
  /** The numerator, the sum of the values (mean), or the count (count). */
  num: number;
  /** The denominator, or how many values (mean). */
  den: number;
  /** The sum of the squares of the values (mean only), for the spread. */
  sumSq: number;
}

/** "ratio": num over den. "mean": the average of den values. "count": a plain number per window. */
export type SeriesKind = "ratio" | "mean" | "count";

export interface Series {
  kind: SeriesKind;
  cells: Map<number, Cell>;
}

export interface ReturnTally {
  /** Sign-ups old enough for their window to be over. */
  signups: number;
  /** Active in their first 24 hours. */
  studiedFirstDay: number;
  /** Active again inside the window (see CohortBlock). */
  back: number;
  /** Of those who studied in their first 24 hours, how many came back. */
  studiedBack: number;
  /** Of the rest, how many came back. */
  restBack: number;
}

export type CohortGroup = "before" | "transition" | "after";

export interface CohortBlock {
  /** "Back" means active between `fromMs` and `toMs` after signing up. */
  fromMs: number;
  toMs: number;
  before: ReturnTally;
  after: ReturnTally;
  /** By the window the sign-up fell in. */
  rows: { k: number; group: CohortGroup; tally: ReturnTally }[];
  /** z of the share who came back, after against before (null when it cannot be judged). */
  z: number | null;
}

export interface ImpactResult {
  originMs: number;
  nowMs: number;
  plan: WindowPlan;
  series: Map<string, Series>;
  /** The payment providers that appear in the orders, in the order they were first seen. */
  providers: string[];
  /** Whom a learner "came back" for: next day (hours 24-48) and the week (hours 24-192). */
  cohorts: { nextDay: CohortBlock; week: CohortBlock };
}

function emptyTally(): ReturnTally {
  return { signups: 0, studiedFirstDay: 0, back: 0, studiedBack: 0, restBack: 0 };
}

/** Is there a time in the sorted list inside [from, to)? */
function anyIn(sorted: readonly number[], from: number, to: number): boolean {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((sorted[mid] ?? Infinity) < from) lo = mid + 1;
    else hi = mid;
  }
  const first = sorted[lo];
  return first !== undefined && first < to;
}

/**
 * Two shares compared (num1/den1 against num2/den2): z of the difference under "no difference".
 * Null when either side is empty or the shares are 0 or 1 (nothing to take a spread from).
 */
export function proportionZ(num1: number, den1: number, num2: number, den2: number): number | null {
  if (den1 <= 0 || den2 <= 0) return null;
  const pooled = (num1 + num2) / (den1 + den2);
  if (pooled <= 0 || pooled >= 1) return null;
  const error = Math.sqrt(pooled * (1 - pooled) * (1 / den1 + 1 / den2));
  return (num2 / den2 - num1 / den1) / error;
}

function tallyOf(
  learners: readonly LearnerRecord[],
  times: ReadonlyMap<string, readonly number[]>,
  nowMs: number,
  fromMs: number,
  toMs: number,
): ReturnTally {
  const tally = emptyTally();
  for (const learner of learners) {
    if (learner.createdAt + toMs > nowMs) continue;
    const mine = times.get(learner.id) ?? [];
    const studied = anyIn(mine, learner.createdAt, learner.createdAt + WINDOW_MS);
    const back = anyIn(mine, learner.createdAt + fromMs, learner.createdAt + toMs);
    tally.signups += 1;
    if (studied) tally.studiedFirstDay += 1;
    if (back) {
      tally.back += 1;
      if (studied) tally.studiedBack += 1;
      else tally.restBack += 1;
    }
  }
  return tally;
}

function cohortBlock(
  learners: readonly LearnerRecord[],
  times: ReadonlyMap<string, readonly number[]>,
  input: ImpactInput,
  fromMs: number,
  toMs: number,
): CohortBlock {
  const { originMs, nowMs, beforeWindows } = input;
  const byWindow = new Map<number, LearnerRecord[]>();
  for (const learner of learners) {
    const k = windowIndex(learner.createdAt, originMs);
    if (k < -beforeWindows) continue;
    let list = byWindow.get(k);
    if (!list) byWindow.set(k, (list = []));
    list.push(learner);
  }
  const before = emptyTally();
  const after = emptyTally();
  const rows: CohortBlock["rows"] = [];
  const add = (into: ReturnTally, from: ReturnTally) => {
    into.signups += from.signups;
    into.studiedFirstDay += from.studiedFirstDay;
    into.back += from.back;
    into.studiedBack += from.studiedBack;
    into.restBack += from.restBack;
  };
  for (const k of Array.from(byWindow.keys()).sort((a, b) => a - b)) {
    const tally = tallyOf(byWindow.get(k) ?? [], times, nowMs, fromMs, toMs);
    // Every sign-up of the window is judged over `toMs`: clean before the change only when all
    // of those hours were before it, clean after it from the change on, a mix in between.
    const group: CohortGroup =
      k >= 0 ? "after" : (k + 1) * WINDOW_MS + toMs <= 0 ? "before" : "transition";
    rows.push({ k, group, tally });
    if (group === "before") add(before, tally);
    if (group === "after") add(after, tally);
  }
  return {
    fromMs,
    toMs,
    before,
    after,
    rows,
    z: proportionZ(before.back, before.signups, after.back, after.signups),
  };
}

// --- Computing the series ----------------------------------------------------------------------

export function computeImpact(input: ImpactInput): ImpactResult {
  const { originMs, nowMs, dataStartMs, beforeWindows } = input;
  const plan = windowPlan(originMs, nowMs, beforeWindows);
  const lastK = plan.partialK ?? plan.afterKs[plan.afterKs.length - 1] ?? -1;
  const created = new Map(input.learners.map((learner) => [learner.id, learner.createdAt]));
  const isReturning = (id: string, start: number) => (created.get(id) ?? Infinity) < start;

  // Per learner: the times they were active, and their blocks of continuous activity.
  const spansBy = new Map<string, Span[]>();
  const timesBy = new Map<string, number[]>();
  for (const moment of input.moments) {
    if (!created.has(moment.userId)) continue;
    let spans = spansBy.get(moment.userId);
    if (!spans) spansBy.set(moment.userId, (spans = []));
    spans.push({ start: moment.start, end: moment.end });
    let times = timesBy.get(moment.userId);
    if (!times) timesBy.set(moment.userId, (times = []));
    times.push(moment.start);
    if (moment.end > moment.start) times.push(moment.end);
  }
  for (const times of timesBy.values()) times.sort((a, b) => a - b);

  const lowK = -beforeWindows - 8;
  const windowsBy = new Map<string, Set<number>>();
  const activeIn = new Map<number, Set<string>>();
  for (const [id, times] of timesBy) {
    const windows = new Set<number>();
    for (const time of times) {
      const k = windowIndex(time, originMs);
      if (k < lowK || k > lastK) continue;
      windows.add(k);
      let active = activeIn.get(k);
      if (!active) activeIn.set(k, (active = new Set()));
      active.add(id);
    }
    windowsBy.set(id, windows);
  }

  const minutesIn = new Map<number, Map<string, number>>();
  const visitsIn = new Map<number, Map<string, number>>();
  for (const [id, spans] of spansBy) {
    let previousEnd = -Infinity;
    for (const block of mergeBlocks(spans)) {
      const newVisit = block.start - previousEnd > VISIT_GAP_MS;
      previousEnd = block.end;
      const k = windowIndex(block.start, originMs);
      if (k < -beforeWindows || k > lastK) continue;
      let minutes = minutesIn.get(k);
      if (!minutes) minutesIn.set(k, (minutes = new Map()));
      minutes.set(id, (minutes.get(id) ?? 0) + (block.end - block.start) / MINUTE_MS);
      if (newVisit) {
        let visits = visitsIn.get(k);
        if (!visits) visitsIn.set(k, (visits = new Map()));
        visits.set(id, (visits.get(id) ?? 0) + 1);
      }
    }
  }

  const presentIn = new Map<number, Set<string>>();
  for (const row of input.presence) {
    if (!created.has(row.userId)) continue;
    const k = windowIndex(row.at, originMs);
    let set = presentIn.get(k);
    if (!set) presentIn.set(k, (set = new Set()));
    set.add(row.userId);
  }

  // Locks, upgrade page, pay presses: learners per window (visitors are only counted).
  const setsOf = () => new Map<number, Set<string>>();
  const lockers = setsOf();
  const lockersByKind: Record<LockKind, Map<number, Set<string>>> = {
    lesson: setsOf(),
    story: setsOf(),
    wordList: setsOf(),
    passage: setsOf(),
  };
  const openers = setsOf();
  const pressers = setsOf();
  const finishers = setsOf();
  const visitorLocks = new Map<number, number>();
  const visitorUpgrades = new Map<number, number>();
  const addTo = (map: Map<number, Set<string>>, k: number, id: string) => {
    let set = map.get(k);
    if (!set) map.set(k, (set = new Set()));
    set.add(id);
  };
  for (const lock of input.locks) {
    const k = windowIndex(lock.at, originMs);
    if (lock.userId === null) visitorLocks.set(k, (visitorLocks.get(k) ?? 0) + 1);
    else if (created.has(lock.userId)) {
      addTo(lockers, k, lock.userId);
      addTo(lockersByKind[lock.kind], k, lock.userId);
    }
  }
  for (const view of input.upgradeViews) {
    const k = windowIndex(view.at, originMs);
    if (view.userId === null) visitorUpgrades.set(k, (visitorUpgrades.get(k) ?? 0) + 1);
    else if (created.has(view.userId)) addTo(openers, k, view.userId);
  }
  for (const press of input.payPresses) {
    if (press.userId !== null && created.has(press.userId)) {
      addTo(pressers, windowIndex(press.at, originMs), press.userId);
    }
  }
  for (const done of input.finishedToday) {
    if (done.userId !== null && created.has(done.userId)) {
      addTo(finishers, windowIndex(done.at, originMs), done.userId);
    }
  }

  const providers: string[] = [];
  for (const order of input.orders) {
    if (!providers.includes(order.provider)) providers.push(order.provider);
  }

  const series = new Map<string, Series>();
  const put = (id: string, kind: SeriesKind, k: number, num: number, den = 1, sumSq = 0) => {
    let entry = series.get(id);
    if (!entry) series.set(id, (entry = { kind, cells: new Map() }));
    entry.cells.set(k, { num, den, sumSq });
  };
  const putMean = (id: string, k: number, values: readonly number[]) => {
    if (values.length === 0) return;
    put(
      id,
      "mean",
      k,
      values.reduce((a, b) => a + b, 0),
      values.length,
      values.reduce((a, b) => a + b * b, 0),
    );
  };
  const median = (values: readonly number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2
      ? (sorted[mid] ?? 0)
      : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  };
  const covered = (k: number) => windowStart(k, originMs) >= dataStartMs;
  /** How many of the learners were already signed up before `start` (the rest signed up inside the window). */
  const countReturning = (set: ReadonlySet<string> | undefined, start: number) => {
    let count = 0;
    for (const id of set ?? []) if (isReturning(id, start)) count += 1;
    return count;
  };

  // Tasks, by the window their rows were dealt in.
  interface TaskAgg {
    rows: number;
    done: number;
  }
  const tasksIn = new Map<number, Map<string, TaskAgg>>();
  const todaySlots = new Map<number, Map<number, TaskAgg>>();
  for (const task of input.tasks) {
    if (!created.has(task.userId)) continue;
    const k = windowIndex(task.createdAt, originMs);
    let learners = tasksIn.get(k);
    if (!learners) tasksIn.set(k, (learners = new Map()));
    const key = `${task.userId}|${task.kind}`;
    const agg = learners.get(key) ?? { rows: 0, done: 0 };
    agg.rows += 1;
    if (task.done) agg.done += 1;
    learners.set(key, agg);
    if (task.kind === "today") {
      let slots = todaySlots.get(k);
      if (!slots) todaySlots.set(k, (slots = new Map()));
      const slot = slots.get(task.slot) ?? { rows: 0, done: 0 };
      slot.rows += 1;
      if (task.done) slot.done += 1;
      slots.set(task.slot, slot);
    }
  }

  const unitsIn = new Map<number, Record<UnitKind, number>>();
  for (const unit of input.units) {
    if (!created.has(unit.userId)) continue;
    const k = windowIndex(unit.at, originMs);
    let counts = unitsIn.get(k);
    if (!counts) unitsIn.set(k, (counts = { lesson: 0, story: 0, passage: 0, word: 0 }));
    counts[unit.kind] += 1;
  }

  const ordersIn = new Map<number, Map<string, number>>();
  const paidIn = new Map<number, number>();
  for (const order of input.orders) {
    if (!created.has(order.userId)) continue;
    const k = windowIndex(order.createdAt, originMs);
    let byProvider = ordersIn.get(k);
    if (!byProvider) ordersIn.set(k, (byProvider = new Map()));
    byProvider.set(order.provider, (byProvider.get(order.provider) ?? 0) + 1);
    if (order.paidAt !== null) {
      const paidK = windowIndex(order.paidAt, originMs);
      paidIn.set(paidK, (paidIn.get(paidK) ?? 0) + 1);
    }
  }

  for (let k = -beforeWindows; k <= lastK; k++) {
    const start = windowStart(k, originMs);
    const active = activeIn.get(k) ?? new Set<string>();
    const returning = countReturning(active, start);
    put("active.all", "count", k, active.size);
    put("active.returning", "count", k, returning);
    put("active.new", "count", k, active.size - returning);

    // Time: learners with a block that started in the window.
    const minutes = minutesIn.get(k);
    if (minutes) {
      const old: number[] = [];
      const fresh: number[] = [];
      const oldVisits: number[] = [];
      for (const [id, value] of minutes) {
        if (isReturning(id, start)) {
          old.push(value);
          // A block that carries on from the window before is not a new visit: at least one.
          oldVisits.push(Math.max(1, visitsIn.get(k)?.get(id) ?? 1));
        } else fresh.push(value);
      }
      putMean("time.minutes.returning", k, old);
      putMean("time.minutes.new", k, fresh);
      putMean("time.visits.returning", k, oldVisits);
      if (old.length > 0) {
        put("time.median.returning", "count", k, median(old));
        put("time.ge10.returning", "ratio", k, old.filter((m) => m >= 10).length, old.length);
        put("time.ge20.returning", "ratio", k, old.filter((m) => m >= 20).length, old.length);
      }
    }

    // Units finished per active learner.
    const units = unitsIn.get(k);
    if (units) {
      for (const kind of ["lesson", "story", "passage", "word"] as const) {
        put(`units.${kind}`, "ratio", k, units[kind], active.size);
      }
    }

    // Returning learners who came at all (studied, opened Home or met a lock).
    const came = new Set(active);
    for (const id of presentIn.get(k) ?? []) came.add(id);
    put("came.returning", "count", k, countReturning(came, start));

    // Return: of those active in the window before, how many are active in this one. The learners
    // are split by whether they had signed up before THAT window began.
    const before = activeIn.get(k - 1);
    if (covered(k - 1) && before) {
      const prevStart = windowStart(k - 1, originMs);
      const back = { all: 0, returning: 0, new: 0 };
      const base = { all: 0, returning: 0, new: 0 };
      for (const id of before) {
        const group = isReturning(id, prevStart) ? "returning" : "new";
        const returned = active.has(id) ? 1 : 0;
        base.all += 1;
        base[group] += 1;
        back.all += returned;
        back[group] += returned;
      }
      for (const group of ["all", "returning", "new"] as const) {
        put(`return.next.${group}`, "ratio", k, back[group], base[group]);
      }
    }

    // Return: learners who signed up 8+ days ago and studied in the week before, back in this window.
    if (covered(k - 7)) {
      let base = 0;
      let back = 0;
      for (const [id, windows] of windowsBy) {
        if ((created.get(id) ?? Infinity) > start - 8 * WINDOW_MS) continue;
        let was = false;
        for (let j = k - 7; j < k && !was; j++) was = windows.has(j);
        if (!was) continue;
        base += 1;
        if (windows.has(k)) back += 1;
      }
      put("return.r7", "ratio", k, back, base);
    }

    // Locks and the road to paying.
    const lockSet = lockers.get(k);
    const openSet = openers.get(k);
    const pressSet = pressers.get(k);
    const lockReturning = countReturning(lockSet, start);
    put("lock.all", "ratio", k, lockSet?.size ?? 0, active.size);
    put("lock.returning", "ratio", k, lockReturning, returning);
    put("lock.new", "ratio", k, (lockSet?.size ?? 0) - lockReturning, active.size - returning);
    for (const kind of ["lesson", "story", "wordList", "passage"] as const) {
      put(`lock.kind.${kind}`, "ratio", k, lockersByKind[kind].get(k)?.size ?? 0, active.size);
    }
    put("upgrade.all", "ratio", k, openSet?.size ?? 0, active.size);
    put("upgrade.perLock", "ratio", k, openSet?.size ?? 0, lockSet?.size ?? 0);
    put("press.all", "ratio", k, pressSet?.size ?? 0, active.size);
    put("press.perLock", "ratio", k, pressSet?.size ?? 0, lockSet?.size ?? 0);
    put("visitors.locks", "count", k, visitorLocks.get(k) ?? 0);
    put("visitors.upgrade", "count", k, visitorUpgrades.get(k) ?? 0);

    // Orders.
    const byProvider = ordersIn.get(k);
    let ordersCreated = 0;
    for (const provider of providers) {
      const n = byProvider?.get(provider) ?? 0;
      ordersCreated += n;
      put(`orders.created.${provider}`, "count", k, n);
    }
    put("orders.created", "count", k, ordersCreated);
    put("orders.paid", "count", k, paidIn.get(k) ?? 0);
    put("orders.paidPer1000", "ratio", k, (paidIn.get(k) ?? 0) * 1000, active.size);

    // Tasks.
    const learners = tasksIn.get(k);
    if (learners) {
      let dealt = 0;
      let one = 0;
      let all = 0;
      for (const agg of learners.values()) {
        dealt += 1;
        if (agg.done >= 1) one += 1;
        if (agg.done === agg.rows) all += 1;
      }
      put("tasks.dealt", "count", k, dealt);
      put("tasks.one", "ratio", k, one, dealt);
      put("tasks.all", "ratio", k, all, dealt);
    }
    for (const [slot, agg] of todaySlots.get(k) ?? []) {
      put(`tasks.today.slot${slot}`, "ratio", k, agg.done, agg.rows);
    }
    put("today.finished", "count", k, finishers.get(k)?.size ?? 0);
  }

  const cohortLearners = input.learners.filter(
    (learner) => learner.createdAt >= windowStart(-beforeWindows, originMs),
  );
  const cohorts = {
    nextDay: cohortBlock(cohortLearners, timesBy, input, WINDOW_MS, 2 * WINDOW_MS),
    week: cohortBlock(cohortLearners, timesBy, input, WINDOW_MS, 8 * WINDOW_MS),
  };
  return { originMs, nowMs, plan, series, providers, cohorts };
}

// --- Comparing before and after -----------------------------------------------------------------

/** How a measure moved: the two marked ones are the readings to trust, the "maybe" ones are hints. */
export type Verdict = "up" | "down" | "maybeUp" | "maybeDown" | "flat" | "early";

export interface Side {
  /** Pooled over the windows. Null when there is nothing to pool. */
  value: number | null;
  min: number | null;
  max: number | null;
  /** The windows that had data. */
  windows: number;
  /** The pooled denominator (people, learners): how much stands behind the value. */
  den: number;
}

export interface Comparison {
  kind: SeriesKind;
  before: Side;
  /** The last few windows before the change, pooled: the baseline closest in time. */
  recent: number | null;
  /** The same weekdays one week earlier, pooled. */
  weekAgo: number | null;
  /** Does the change also stand against `recent` and `weekAgo` (same direction, a real share of the size)? */
  consistent: boolean;
  after: Side & { perWindow: (number | null)[] };
  diff: number | null;
  /** The difference as a share of the before value. */
  relative: number | null;
  z: number | null;
  /** Where the windows after sit against the whole range of the windows before. */
  position: "above" | "below" | "inside" | "none";
  verdict: Verdict;
}

/** How many of the windows right before the change make up the "recent" baseline. */
export const RECENT_WINDOWS = 4;

function valueOf(kind: SeriesKind, cell: Cell | undefined): number | null {
  if (!cell) return null;
  if (kind === "count") return cell.num;
  return cell.den > 0 ? cell.num / cell.den : null;
}

function sideOf(kind: SeriesKind, cells: readonly (Cell | undefined)[]): Side {
  const present = cells.filter((cell): cell is Cell => cell !== undefined);
  const values = present
    .map((cell) => valueOf(kind, cell))
    .filter((value): value is number => value !== null);
  if (values.length === 0) return { value: null, min: null, max: null, windows: 0, den: 0 };
  const num = present.reduce((sum, cell) => sum + cell.num, 0);
  const den = present.reduce((sum, cell) => sum + cell.den, 0);
  return {
    value: kind === "count" ? num / present.length : den > 0 ? num / den : null,
    min: Math.min(...values),
    max: Math.max(...values),
    windows: values.length,
    den: kind === "count" ? 0 : den,
  };
}

/** Welch's z for two means built from (sum, count, sum of squares) cells. */
function meanZ(before: readonly Cell[], after: readonly Cell[]): number | null {
  const pool = (cells: readonly Cell[]) => {
    const n = cells.reduce((sum, cell) => sum + cell.den, 0);
    const total = cells.reduce((sum, cell) => sum + cell.num, 0);
    const squares = cells.reduce((sum, cell) => sum + cell.sumSq, 0);
    if (n < 2) return null;
    const mean = total / n;
    return { n, mean, variance: Math.max(0, (squares - n * mean * mean) / (n - 1)) };
  };
  const b = pool(before);
  const a = pool(after);
  if (!b || !a) return null;
  const error = Math.sqrt(b.variance / b.n + a.variance / a.n);
  return error > 0 ? (a.mean - b.mean) / error : null;
}

export function compareSeries(
  series: Series | undefined,
  beforeKs: readonly number[],
  afterKs: readonly number[],
): Comparison | null {
  if (!series) return null;
  const { kind } = series;
  const beforeCells = beforeKs.map((k) => series.cells.get(k));
  const afterCells = afterKs.map((k) => series.cells.get(k));
  const before = sideOf(kind, beforeCells);
  const afterSide = sideOf(kind, afterCells);
  const recent = sideOf(kind, beforeCells.slice(-RECENT_WINDOWS)).value;
  // The same weekdays one week earlier: window k's twin is window k - 7 (only if that is before the change).
  const weekAgo = sideOf(
    kind,
    afterKs.map((k) => (k - 7 < 0 ? series.cells.get(k - 7) : undefined)),
  ).value;
  const diff =
    before.value !== null && afterSide.value !== null ? afterSide.value - before.value : null;
  const relative = diff !== null && before.value ? diff / before.value : null;
  // The change must also stand against the two closer baselines: the same direction and at least a
  // quarter of the size. A rise over the whole fortnight that was already there last week is not news.
  const agrees = (baseline: number | null) =>
    baseline === null ||
    diff === null ||
    afterSide.value === null ||
    ((afterSide.value - baseline) * diff > 0 &&
      Math.abs(afterSide.value - baseline) >= 0.25 * Math.abs(diff));
  const consistent = agrees(recent) && agrees(weekAgo);

  let z: number | null = null;
  const presentBefore = beforeCells.filter((cell): cell is Cell => cell !== undefined);
  const presentAfter = afterCells.filter((cell): cell is Cell => cell !== undefined);
  if (kind === "ratio" && before.den > 0 && afterSide.den > 0) {
    const sum = (cells: readonly Cell[]) => cells.reduce((total, cell) => total + cell.num, 0);
    z = proportionZ(sum(presentBefore), before.den, sum(presentAfter), afterSide.den);
  } else if (kind === "mean") {
    z = meanZ(presentBefore, presentAfter);
  }

  const perWindow = afterCells.map((cell) => valueOf(kind, cell));
  const afterValues = perWindow.filter((value): value is number => value !== null);
  let position: Comparison["position"] = "none";
  if (before.min !== null && before.max !== null && afterValues.length > 0) {
    if (afterValues.every((value) => value > (before.max ?? Infinity))) position = "above";
    else if (afterValues.every((value) => value < (before.min ?? -Infinity))) position = "below";
    else position = "inside";
  }

  let verdict: Verdict = "early";
  if (diff !== null && afterSide.windows >= 2 && before.windows >= 3) {
    const clearZ = z !== null && Math.abs(z) >= 1.96;
    const outside = position === "above" || position === "below";
    if (outside && (kind === "count" || clearZ) && consistent) verdict = diff > 0 ? "up" : "down";
    else if (outside || clearZ) verdict = diff > 0 ? "maybeUp" : "maybeDown";
    else verdict = "flat";
  }

  return {
    kind,
    before,
    recent,
    weekAgo,
    consistent,
    after: { ...afterSide, perWindow },
    diff,
    relative,
    z,
    position,
    verdict,
  };
}
