import type { BadgeId } from "@/lib/features/catalog";
import type { PassageProgress, PassageSummary } from "@/lib/passages/types";

/**
 * The pure rules around a learner's progress through passages — where a
 * visit starts, what a card says, which passage to suggest next. Kept free of
 * React and Supabase so each rule is a unit test, not something to discover in
 * a browser.
 */

export type PassageStatus = "new" | "in-progress" | "done";

export function passageStatus(
  progress: PassageProgress | undefined,
  sectionCount: number,
): PassageStatus {
  if (!progress) return "new";
  if (progress.completedAt) return "done";
  if (progress.sectionsDone >= sectionCount && sectionCount > 0) return "done";
  return progress.sectionsDone > 0 ? "in-progress" : "new";
}

/**
 * The part a visit opens on. A passage in progress resumes at the first part
 * not finished yet; a finished one (or one never started) starts from the top —
 * re-reading a finished passage should feel like a fresh pass, not a jump to
 * its last screen.
 */
export function resumeSectionIndex(
  progress: PassageProgress | undefined,
  sectionCount: number,
): number {
  if (sectionCount <= 0) return 0;
  if (passageStatus(progress, sectionCount) !== "in-progress") return 0;
  return Math.min(Math.max(progress?.sectionsDone ?? 0, 0), sectionCount - 1);
}

/**
 * The passage to suggest: one already started comes first (finish what you
 * began), then the first untouched one in list order. Null once everything is
 * done. Never locks anything — it only points.
 */
export function recommendedPassageId(
  passages: readonly Pick<PassageSummary, "id" | "sectionCount">[],
  progressById: ReadonlyMap<string, PassageProgress>,
): string | null {
  let firstNew: string | null = null;
  for (const passage of passages) {
    const status = passageStatus(progressById.get(passage.id), passage.sectionCount);
    if (status === "in-progress") return passage.id;
    if (status === "new" && firstNew === null) firstNew = passage.id;
  }
  return firstNew;
}

/** Passages finished -> the event badge earned on reaching that many. */
export const PASSAGE_COUNT_BADGES: readonly { count: number; id: BadgeId }[] = [
  { count: 1, id: "firstPassage" },
  { count: 5, id: "passages5" },
  { count: 10, id: "passages10" },
];

/** The badges a learner who has finished `finished` passages holds by now (the database ignores the ones they already have). */
export function passageBadgesFor(finished: number): BadgeId[] {
  return PASSAGE_COUNT_BADGES.filter((badge) => finished >= badge.count).map((badge) => badge.id);
}

/** What Home's Passages card points at. */
export interface PassageHomePick {
  passage: PassageSummary;
  /** "continue": a passage already started; "next": the first one not started yet. */
  mode: "continue" | "next";
  /** Parts already finished (0 for "next"). */
  sectionsDone: number;
}

/**
 * The one passage Home suggests: the same pick as the list's "Up next"
 * (recommendedPassageId) with what the card needs to say about it. Null once
 * every passage is done — the card is then simply not shown.
 */
export function homeCardPick(
  passages: readonly PassageSummary[],
  progressById: ReadonlyMap<string, PassageProgress>,
): PassageHomePick | null {
  const id = recommendedPassageId(passages, progressById);
  const passage = id === null ? undefined : passages.find((candidate) => candidate.id === id);
  if (!passage) return null;
  const progress = progressById.get(passage.id);
  const inProgress = passageStatus(progress, passage.sectionCount) === "in-progress";
  return {
    passage,
    mode: inProgress ? "continue" : "next",
    sectionsDone: inProgress ? (progress?.sectionsDone ?? 0) : 0,
  };
}

/** What the reader sends after each part. */
export interface PassageProgressInput {
  passageId: string;
  /** Parts finished so far (answered and moved past). */
  sectionsDone: number;
  /** Questions answered right on the first try so far. */
  correct: number;
  /** Questions answered so far. */
  total: number;
  /** True only on the save of the last part, when the whole passage is finished. */
  completed: boolean;
  /** The learner's own calendar date (the server cannot know it), for the quest, streak and calendar a finished part counts toward. Null when it was missing or could not be right. */
  todayISO: string | null;
}

const MAX_COUNT = 60;

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_COUNT;
}

/** Every real time zone is within this many hours of UTC, so a date further from "now" than this is not a learner's today. */
const MAX_TIME_ZONE_OFFSET_HOURS = 36;

/**
 * The date a learner's browser reported, if it can be their today: a
 * YYYY-MM-DD that is a real date and no further from the server's clock than
 * any time zone reaches. The streak and the quests are keyed on this date and
 * the browser is not trusted with an arbitrary one.
 */
export function plausibleLearnerDate(value: unknown, now: number = Date.now()): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const at = Date.parse(`${value}T12:00:00Z`);
  if (Number.isNaN(at) || new Date(at).toISOString().slice(0, 10) !== value) return null;
  return Math.abs(at - now) <= (MAX_TIME_ZONE_OFFSET_HOURS + 12) * 3_600_000 ? value : null;
}

/**
 * Validates a progress save before it reaches the database — a Server Action
 * is reachable as a direct POST, so the reader's own arithmetic is never the
 * boundary. Null means "reject": wrong shape, an id that cannot be a passage
 * id, a score above the number of questions asked, or counts no real passage
 * could have. A date that cannot be right does not reject the save (the
 * learner's place must still be kept) — it only costs the day-keyed extras.
 */
export function parsePassageProgressInput(
  raw: unknown,
  now: number = Date.now(),
): PassageProgressInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw as Record<string, unknown>;
  const { passageId, sectionsDone, correct, total, completed } = input;
  if (typeof passageId !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(passageId)) return null;
  if (passageId.length > 120) return null;
  if (!isCount(sectionsDone) || !isCount(correct) || !isCount(total)) return null;
  if (correct > total) return null;
  if (typeof completed !== "boolean") return null;
  return {
    passageId,
    sectionsDone,
    correct,
    total,
    completed,
    todayISO: plausibleLearnerDate(input.todayISO, now),
  };
}

/** What record_passage_progress counted as new from one save. Only the database can say this. */
export interface PassageSaveOutcome {
  /** Parts this save finished that the database had not stored before. */
  partsAdded: number;
  /** True only on the save that first finishes the whole passage. */
  newlyCompleted: boolean;
}

/**
 * Reads the row record_passage_progress returns. Null when there is no row (the function
 * still returns nothing) or the row is malformed: the caller then counts nothing toward
 * quests, rather than trusting the browser's flags.
 */
export function passageSaveOutcome(data: unknown): PassageSaveOutcome | null {
  const row: unknown = Array.isArray(data) ? data[0] : data;
  if (typeof row !== "object" || row === null) return null;
  const fields = row as Record<string, unknown>;
  const partsAdded = fields.parts_added;
  const newlyCompleted = fields.newly_completed;
  if (!isCount(partsAdded) || typeof newlyCompleted !== "boolean") return null;
  return { partsAdded, newlyCompleted };
}

/** Whole-number percentage, 0 when nothing was asked. */
export function scorePercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(Math.max(correct, 0), total) / total) * 100);
}

/** Seconds a learner spends on one line (hear it, read it, maybe replay it) and on one question — rough, and only ever shown rounded up to whole minutes. */
const SECONDS_PER_LINE = 7;
const SECONDS_PER_QUESTION = 20;

export function estimatePassageMinutes(lineCount: number, questionCount: number): number {
  const seconds = lineCount * SECONDS_PER_LINE + questionCount * SECONDS_PER_QUESTION;
  return Math.max(2, Math.ceil(seconds / 60));
}
