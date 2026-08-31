import { calculateLessonXp } from "@/lib/progress/xp";
import type { LearningMode } from "@/types/content";
import type { ProgressState, StreakState } from "@/lib/progress/types";

/**
 * A guest completion already checked against real content + access (see
 * migrateGuestProgressAction) — the only shape this module's pure functions
 * ever see, so none of them need to re-validate a lesson exists or is
 * unlocked.
 */
export interface ValidatedGuestCompletion {
  lessonId: string;
  mode: LearningMode;
  accuracy: number;
  completedAt: string;
  sentenceCount: number;
}

/**
 * Guest completions the server doesn't already have — the only ones a
 * migration should ever write. A lesson already completed server-side is
 * never touched, so a returning learner's real completion (accuracy,
 * attempt_count, completed_at) can never be clobbered by weaker,
 * locally-cached guest data for the same lesson.
 */
export function selectCompletionsToMigrate(
  validated: ValidatedGuestCompletion[],
  existingServerLessonIds: ReadonlySet<string>,
): ValidatedGuestCompletion[] {
  return validated.filter((completion) => !existingServerLessonIds.has(completion.lessonId));
}

/**
 * XP earned by the migrated completions only — never the guest's raw
 * localStorage `xp` total, which a client could set to anything. Every
 * migrated completion counts as a first completion (it's new server-side by
 * construction — see selectCompletionsToMigrate) with no retroactive
 * daily-goal bonus, since "goal met today" doesn't meaningfully apply to a
 * historical, possibly-multi-day-old piece of guest activity.
 */
export function computeMigrationXp(toMigrate: ValidatedGuestCompletion[]): number {
  return toMigrate.reduce(
    (total, completion) =>
      total +
      calculateLessonXp({
        accuracy: completion.accuracy,
        isFirstCompletion: true,
        dailyGoalMet: false,
      }),
    0,
  );
}

/**
 * Sentences to add to today's daily-progress tally — derived only from
 * migrated completions that actually happened today (by calendar date),
 * never from the guest's separately-tracked `dailyProgress` counter, which
 * could drift from the real completion history. `todayISO` is the learner's
 * own local date (see todayLocalISODate) rather than one computed here,
 * since this runs from a Server Action in the server's time zone.
 */
export function computeMigrationDailyProgress(
  toMigrate: ValidatedGuestCompletion[],
  todayISO: string,
): number {
  return toMigrate
    .filter((completion) => completion.completedAt.slice(0, 10) === todayISO)
    .reduce((total, completion) => total + completion.sentenceCount, 0);
}

/**
 * Whether — and how — to carry a guest's streak into a signed-in account.
 * A learner with no server streak row yet (brand new, or never completed a
 * lesson while signed in) adopts the guest's streak wholesale — there is
 * nothing of theirs to lose. One who already has a server streak keeps its
 * currentStreak/lastActiveDate untouched (a guest's locally-tracked days
 * aren't provably continuous with the server's own last-active date) and
 * only ever raises longestStreak, matching the existing "longest never
 * decreases" invariant (see streak.test.ts).
 */
export function mergeStreak(
  serverStreak: StreakState | null,
  guestStreak: StreakState,
): { streak: StreakState; changed: boolean } {
  if (serverStreak === null) {
    if (guestStreak.lastActiveDate === null) return { streak: guestStreak, changed: false };
    return { streak: guestStreak, changed: true };
  }
  if (guestStreak.longestStreak > serverStreak.longestStreak) {
    return { streak: { ...serverStreak, longestStreak: guestStreak.longestStreak }, changed: true };
  }
  return { streak: serverStreak, changed: false };
}

/**
 * Whether a guest has anything worth migrating at all — lets the caller
 * skip the migration round trip entirely for the overwhelmingly common case
 * (an already-registered learner with no local guest activity on this
 * device).
 */
export function hasMigratableGuestState(guest: ProgressState): boolean {
  return guest.completions.length > 0 || guest.startingLevel !== null;
}
