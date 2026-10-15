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

/** What the reader sends after each part and once more at the end. */
export interface PassageProgressInput {
  passageId: string;
  /** Parts finished so far (answered and moved past). */
  sectionsDone: number;
  /** Questions answered right on the first try so far. */
  correct: number;
  /** Questions answered so far. */
  total: number;
  /** True only on the final save, when the whole passage is finished. */
  completed: boolean;
}

const MAX_COUNT = 60;

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_COUNT;
}

/**
 * Validates a progress save before it reaches the database — a Server Action
 * is reachable as a direct POST, so the reader's own arithmetic is never the
 * boundary. Null means "reject": wrong shape, an id that cannot be a passage
 * id, a score above the number of questions asked, or counts no real passage
 * could have.
 */
export function parsePassageProgressInput(raw: unknown): PassageProgressInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw as Record<string, unknown>;
  const { passageId, sectionsDone, correct, total, completed } = input;
  if (typeof passageId !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(passageId)) return null;
  if (passageId.length > 120) return null;
  if (!isCount(sectionsDone) || !isCount(correct) || !isCount(total)) return null;
  if (correct > total) return null;
  if (typeof completed !== "boolean") return null;
  return { passageId, sectionsDone, correct, total, completed };
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
