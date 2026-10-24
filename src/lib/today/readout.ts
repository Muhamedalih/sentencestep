import { addDays, utcDay } from "@/lib/readout/returns";
import type { Signup } from "@/lib/readout/returns";
import { STEP_KINDS } from "@/lib/today/plan";
import { todayQuestSlot } from "@/lib/today/quests";

/**
 * Pure parts of the read-only readouts of Today's session (scripts/today-readout.ts) and of the
 * sentence bank (scripts/sentence-bank-readout.ts): how many of Today's three tasks get done, and
 * which sign-ups fall before and after a change. Nothing here reads or writes the database.
 */

/** The slots of Today's three tasks (listen, story, words) in `daily_quests`. */
export const TODAY_SLOTS: readonly number[] = STEP_KINDS.map(todayQuestSlot);

export interface QuestRow {
  user_id: string;
  quest_date: string;
  slot: number;
  quest_type: string;
  completed_at: string | null;
}

export interface SlotCompletion {
  dealt: number;
  completed: number;
}

export interface ThreeTaskStats {
  /** Distinct learners with at least one day on which all three tasks were dealt. */
  learners: number;
  /** Learner-days with all three tasks dealt. */
  userDays: number;
  /** Of those, the days on which all three were completed. */
  allDone: number;
  /** Rows dealt and completed per slot (all rows given, whether or not the day had all three). */
  bySlot: Record<number, SlotCompletion>;
}

export function emptyThreeTaskStats(): ThreeTaskStats {
  return {
    learners: 0,
    userDays: 0,
    allDone: 0,
    bySlot: Object.fromEntries(TODAY_SLOTS.map((slot) => [slot, { dealt: 0, completed: 0 }])),
  };
}

/** What became of Today's three tasks in the rows given (rows of other slots are ignored). */
export function threeTaskStats(rows: readonly QuestRow[]): ThreeTaskStats {
  const stats = emptyThreeTaskStats();
  const days = new Map<string, Map<number, boolean>>();
  for (const row of rows) {
    if (!TODAY_SLOTS.includes(row.slot)) continue;
    const slot = stats.bySlot[row.slot];
    if (!slot) continue;
    const done = row.completed_at !== null;
    slot.dealt += 1;
    if (done) slot.completed += 1;
    const key = `${row.user_id}|${row.quest_date}`;
    let day = days.get(key);
    if (!day) days.set(key, (day = new Map()));
    day.set(row.slot, done);
  }
  const learners = new Set<string>();
  for (const [key, day] of days) {
    if (day.size !== TODAY_SLOTS.length) continue;
    stats.userDays += 1;
    learners.add(key.slice(0, key.indexOf("|")));
    if (Array.from(day.values()).every(Boolean)) stats.allDone += 1;
  }
  stats.learners = learners.size;
  return stats;
}

/** The same, one entry per quest date. */
export function threeTaskStatsByDay(rows: readonly QuestRow[]): Map<string, ThreeTaskStats> {
  const byDate = new Map<string, QuestRow[]>();
  for (const row of rows) {
    let list = byDate.get(row.quest_date);
    if (!list) byDate.set(row.quest_date, (list = []));
    list.push(row);
  }
  return new Map(Array.from(byDate, ([date, list]) => [date, threeTaskStats(list)]));
}

export interface CohortSplit {
  liveDay: string;
  /** Signed up in the `windowDays` whole days before the day of the change. */
  before: Signup[];
  /** Signed up on a whole day after the day of the change. */
  after: Signup[];
}

/**
 * Splits sign-ups by a moment of change into whole-day groups. The day of the change itself is in
 * neither: it is split between "before" and "after", and a sign-up that morning is not a clean case
 * of either.
 */
export function splitSignups(
  signups: readonly Signup[],
  changeMs: number,
  windowDays: number,
): CohortSplit {
  const liveDay = utcDay(changeMs);
  const from = addDays(liveDay, -windowDays);
  return {
    liveDay,
    before: signups.filter((signup) => signup.day >= from && signup.day < liveDay),
    after: signups.filter((signup) => signup.day > liveDay),
  };
}

/** How many of the given dates fall on each day. */
export function countByDay(dates: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const date of dates) counts.set(date, (counts.get(date) ?? 0) + 1);
  return counts;
}
