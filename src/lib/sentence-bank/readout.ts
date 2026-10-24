import { isRolloutOpen, learnerSharePercent } from "@/lib/rollouts/config";
import type { RolloutConfig } from "@/lib/rollouts/config";
import { finishedLessonDays } from "@/lib/sentence-bank/finished";
import { WEEKLY_CHECK_MIN, weeklyLine, weeklyStoryCounts } from "@/lib/sentence-bank/weekly";
import type { LastCheck } from "@/lib/sentence-bank/weekly";
import { TODAY_SENTENCE_SLOT } from "@/lib/today/quests";
import type { QuestRow, ThreeTaskStats } from "@/lib/today/readout";

/**
 * Pure parts of the sentence-bank readout (scripts/sentence-bank-readout.ts): which arm a learner
 * is in, and the figures the stop rules of docs/sentence-bank.md are judged on. Nothing here reads
 * or writes the database.
 */

export type Arm = "bank" | "control";

/** What the sentence bank is open to, as the Permissions page has it. */
export type BankOpening =
  | { kind: "closed"; mode: "admin" | "emails" }
  | { kind: "everyone" }
  | { kind: "share"; percent: number };

export function bankOpening(config: RolloutConfig): BankOpening {
  const entry = config.sentenceBank;
  if (entry.mode !== "everyone") return { kind: "closed", mode: entry.mode };
  const percent = learnerSharePercent("sentenceBank", entry);
  return percent === null ? { kind: "everyone" } : { kind: "share", percent };
}

/**
 * The arm of a signed-in learner who is not an admin, from the stored settings and nothing else:
 * the same formula the site uses (rolloutBucket). `null` when the learner is outside Today's
 * session, where the bank does not exist (so they are in neither arm). When the bank is open to
 * everyone every learner is in the bank arm and there is no control.
 */
export function armOf(userId: string, config: RolloutConfig): Arm | null {
  const viewer = { isAdmin: false, userId, email: null, preview: false };
  if (!isRolloutOpen(config.todaySession, viewer, "todaySession")) return null;
  return isRolloutOpen(config.sentenceBank, viewer, "sentenceBank") ? "bank" : "control";
}

/** The stop rules of the report, plus the guard proposed for the Today tasks. */
export const STOP_RULES = {
  /** Learners shown the row who finish it. */
  finishShare: 0.4,
  /** First-go accuracy of the sentences asked. */
  accuracy: 0.5,
  /** The bank arm may not finish all three tasks this many points less often than the control. */
  guardPoints: 2,
  /** Learners (with all three tasks dealt) needed in each arm before the guard is judged. */
  guardMinLearners: 500,
  /** Rows / sentences needed before a share is judged at all. */
  minForShare: 30,
} as const;

export type Verdict = "ok" | "below" | "too few";

export function judgeShare(part: number, whole: number, threshold: number): Verdict {
  if (whole < STOP_RULES.minForShare) return "too few";
  return part / whole >= threshold ? "ok" : "below";
}

export interface ExposureStats {
  /** Learners who were dealt the row. */
  learners: number;
  dealt: number;
  completed: number;
  learnersCompleted: number;
}

/** Today's optional row "Test yourself on today's lessons" (slot 13, type sentenceReview). */
export function exposure(rows: readonly QuestRow[]): ExposureStats {
  const dealt = new Set<string>();
  const completed = new Set<string>();
  const stats: ExposureStats = { learners: 0, dealt: 0, completed: 0, learnersCompleted: 0 };
  for (const row of rows) {
    if (row.slot !== TODAY_SENTENCE_SLOT || row.quest_type !== "sentenceReview") continue;
    stats.dealt += 1;
    dealt.add(row.user_id);
    if (row.completed_at !== null) {
      stats.completed += 1;
      completed.add(row.user_id);
    }
  }
  stats.learners = dealt.size;
  stats.learnersCompleted = completed.size;
  return stats;
}

export interface EventRow {
  user_id: string | null;
  event_name: string;
  event_properties: unknown;
}

export interface VisitStats {
  started: number;
  finished: number;
  /** Sentences asked in the finished visits, and how the first go went. */
  asked: number;
  clean: number;
  assisted: number;
  missed: number;
  checkStarted: number;
  checkFinished: number;
}

function num(properties: unknown, key: string): number {
  if (typeof properties !== "object" || properties === null) return 0;
  const value = (properties as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function visitStats(events: readonly EventRow[]): VisitStats {
  const stats: VisitStats = {
    started: 0,
    finished: 0,
    asked: 0,
    clean: 0,
    assisted: 0,
    missed: 0,
    checkStarted: 0,
    checkFinished: 0,
  };
  for (const event of events) {
    switch (event.event_name) {
      case "SENTENCE_REVIEW_STARTED":
        stats.started += 1;
        break;
      case "SENTENCE_REVIEW_FINISHED":
        stats.finished += 1;
        stats.asked += num(event.event_properties, "count");
        stats.clean += num(event.event_properties, "clean");
        stats.assisted += num(event.event_properties, "assisted");
        stats.missed += num(event.event_properties, "missed");
        break;
      case "SENTENCE_CHECK_STARTED":
        stats.checkStarted += 1;
        break;
      case "SENTENCE_CHECK_FINISHED":
        stats.checkFinished += 1;
        break;
    }
  }
  return stats;
}

export interface CheckRow {
  user_id: string;
  asked: number;
  remembered: number;
  written: number;
}

export interface CheckStats {
  learners: number;
  checks: number;
  /** Checks that asked at least WEEKLY_CHECK_MIN sentences: the only ones the site shows a number for. */
  counted: number;
  asked: number;
  remembered: number;
}

export function checkStats(rows: readonly CheckRow[]): CheckStats {
  const stats: CheckStats = {
    learners: 0,
    checks: rows.length,
    counted: 0,
    asked: 0,
    remembered: 0,
  };
  const learners = new Set<string>();
  for (const row of rows) {
    learners.add(row.user_id);
    if (row.asked < WEEKLY_CHECK_MIN) continue;
    stats.counted += 1;
    stats.asked += row.asked;
    stats.remembered += row.remembered;
  }
  stats.learners = learners.size;
  return stats;
}

export interface MasteryStats {
  /** Learners with at least one sentence at strength 2 or more. */
  learners: number;
  total: number;
  /** Median number of such sentences among those learners. */
  median: number;
}

/** `userIds`: one entry per sentence at strength 2 or more (a learner appears once per sentence). */
export function masteryStats(userIds: readonly string[]): MasteryStats {
  const perLearner = new Map<string, number>();
  for (const id of userIds) perLearner.set(id, (perLearner.get(id) ?? 0) + 1);
  const counts = Array.from(perLearner.values()).sort((a, b) => a - b);
  const middle = Math.floor(counts.length / 2);
  const median =
    counts.length === 0
      ? 0
      : counts.length % 2 === 1
        ? (counts[middle] ?? 0)
        : ((counts[middle - 1] ?? 0) + (counts[middle] ?? 0)) / 2;
  return { learners: counts.length, total: userIds.length, median };
}

export interface GuardResult {
  status: Verdict;
  /** Bank arm minus control, in percentage points of learner-days with all three tasks done. */
  gapPoints: number | null;
}

/**
 * The guard: is the bank arm finishing Today's three tasks (the optional row is not one of them)
 * clearly less often than the control? Judged only once each arm has enough learners.
 */
export function guardVerdict(bank: ThreeTaskStats, control: ThreeTaskStats): GuardResult {
  if (bank.userDays === 0 || control.userDays === 0) return { status: "too few", gapPoints: null };
  // To a tenth of a point, which is also how it is printed (and keeps exactly 2.0 from rounding past the line).
  const gapPoints =
    Math.round(1000 * (bank.allDone / bank.userDays - control.allDone / control.userDays)) / 10;
  if (
    bank.learners < STOP_RULES.guardMinLearners ||
    control.learners < STOP_RULES.guardMinLearners
  ) {
    return { status: "too few", gapPoints };
  }
  return { status: gapPoints < -STOP_RULES.guardPoints ? "below" : "ok", gapPoints };
}

export interface StoryCompletionRow {
  user_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface WeeklyCheckRow extends CheckRow {
  checked_on: string;
}

export interface WeeklyStateStats {
  /** Learners looked at: those of the group seen in the last seven days. */
  learners: number;
  /** Shown the locked card (fewer than three general stories finished on earlier days in the last week). */
  locked: number;
  /** Of those, learners with no story counting toward the three yet (a story finished today doesn't count until tomorrow). */
  lockedNothingYet: number;
  /** Of those, learners for whom tomorrow is enough: the card says it opens tomorrow. */
  lockedOpensTomorrow: number;
  /** Median stories counted toward the three among the locked (null with none locked). */
  lockedMedianHave: number | null;
  /** Shown the clear card with its start button: unlocked and not yet taken this week. */
  ready: number;
  /** In the week after a check that asked enough to show a number: the quiet result line. */
  resultShown: number;
  /** In the week after a check that asked fewer than five: no line at all. */
  noLine: number;
}

/**
 * How many learners would be shown each state of the weekly card RIGHT NOW. The site does not
 * record which card a learner saw, so this does what the site does (weeklyLine / weeklyStoryCounts, the
 * same functions) from their finished stories and last check. Days are UTC days, not each learner's
 * own calendar day, so a learner near midnight can sit in the neighbouring state. `learners` is who
 * to count (the caller decides: seen in the last week); a learner with no story and no check is
 * "locked, nothing yet", which is also what they would see.
 */
export function weeklyStates(input: {
  learners: ReadonlySet<string>;
  completions: readonly StoryCompletionRow[];
  checks: readonly WeeklyCheckRow[];
  todayISO: string;
}): WeeklyStateStats {
  const { todayISO } = input;
  const dayOf = (iso: string) => new Date(iso).toISOString().slice(0, 10);

  const completionsOf = new Map<
    string,
    { lessonId: string; mode: string; completedAt: string }[]
  >();
  for (const row of input.completions) {
    const entry = { lessonId: row.lesson_id, mode: "stories", completedAt: row.completed_at };
    const list = completionsOf.get(row.user_id);
    if (list) list.push(entry);
    else completionsOf.set(row.user_id, [entry]);
  }
  const lastOf = new Map<string, LastCheck>();
  for (const row of input.checks) {
    const known = lastOf.get(row.user_id);
    if (known && known.checkedOn >= row.checked_on) continue;
    lastOf.set(row.user_id, {
      checkedOn: row.checked_on,
      asked: row.asked,
      remembered: row.remembered,
      written: row.written,
    });
  }

  const stats: WeeklyStateStats = {
    learners: 0,
    locked: 0,
    lockedNothingYet: 0,
    lockedOpensTomorrow: 0,
    lockedMedianHave: null,
    ready: 0,
    resultShown: 0,
    noLine: 0,
  };
  const haves: number[] = [];

  for (const userId of input.learners) {
    stats.learners += 1;
    const finished = finishedLessonDays(completionsOf.get(userId) ?? [], dayOf);
    const line = weeklyLine({
      last: lastOf.get(userId) ?? null,
      todayISO,
      ...weeklyStoryCounts(finished, todayISO),
    });
    if (line === null) stats.noLine += 1;
    else if (line.kind === "due") stats.ready += 1;
    else if (line.kind === "result") stats.resultShown += 1;
    else {
      stats.locked += 1;
      haves.push(line.have);
      if (line.have === 0) stats.lockedNothingYet += 1;
      if (line.tomorrow) stats.lockedOpensTomorrow += 1;
    }
  }

  if (haves.length > 0) {
    haves.sort((a, b) => a - b);
    const middle = Math.floor(haves.length / 2);
    stats.lockedMedianHave =
      haves.length % 2 === 1 ? haves[middle]! : (haves[middle - 1]! + haves[middle]!) / 2;
  }
  return stats;
}
