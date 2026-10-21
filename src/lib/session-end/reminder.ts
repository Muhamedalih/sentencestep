/**
 * The "remind me tomorrow" rules of the lesson-ending screen, as small pure functions so each can
 * be tested on its own. The screen (session-end.tsx), the action that stores a choice
 * (reminder-actions.ts) and the hourly sender (src/lib/email/nudges/run.ts) all use them.
 */

/** The hours offered on the finish screen, in the learner's own evening (8, 9 and 10 pm). */
export const REMINDER_HOURS = [20, 21, 22] as const;

const HOUR_MS = 3_600_000;

/** The earliest and latest a reminder may be set for, from now: anything else is not "tomorrow evening". */
export const REMINDER_MIN_AHEAD_MS = 1 * HOUR_MS;
export const REMINDER_MAX_AHEAD_MS = 40 * HOUR_MS;

/** A reminder is still sent for up to this long after its hour (a missed hourly run, a busy server); after that it is dropped rather than sent late at night. */
export const REMINDER_GRACE_MS = 6 * HOUR_MS;

/** A learner who studied within this long before the hour has already come back, so the reminder is not sent. */
export const REMINDER_RETURNED_WINDOW_MS = 20 * HOUR_MS;

/** Tomorrow at `hour`:00 on the learner's own clock (this runs in their browser). */
export function reminderTimeFor(hour: number, now: Date = new Date()): Date {
  const when = new Date(now);
  when.setDate(when.getDate() + 1);
  when.setHours(hour, 0, 0, 0);
  return when;
}

/** Whether `remindAt` (an ISO instant from the browser) is a time the action will store: a real instant between an hour and forty hours away. */
export function isStorableReminderTime(remindAt: string, now: Date): boolean {
  const when = Date.parse(remindAt);
  if (!Number.isFinite(when)) return false;
  const ahead = when - now.getTime();
  return ahead >= REMINDER_MIN_AHEAD_MS && ahead <= REMINDER_MAX_AHEAD_MS;
}

/** The reminders the hourly run looks at: due now, and not so long ago that sending would be late-night spam. */
export function reminderWindowBounds(now: Date): { from: Date; to: Date } {
  return { from: new Date(now.getTime() - REMINDER_GRACE_MS), to: now };
}

/**
 * Whether a reminder due at `remindAt` should still go out: the learner has not already come back,
 * meaning no lesson finished since `REMINDER_RETURNED_WINDOW_MS` before the hour (so an extra lesson
 * done the evening before does not cancel tomorrow's reminder).
 */
export function hasReturnedBeforeReminder(
  remindAt: string,
  lessonFinishedAt: readonly string[],
): boolean {
  const due = Date.parse(remindAt);
  if (!Number.isFinite(due)) return false;
  const since = due - REMINDER_RETURNED_WINDOW_MS;
  return lessonFinishedAt.some((iso) => {
    const finished = Date.parse(iso);
    return Number.isFinite(finished) && finished >= since && finished <= due;
  });
}

/** SESSION_REMINDER_MAX_PER_RUN: how many reminder emails one hourly run may send. Off (0) unless set to a positive number, so nothing is ever sent by accident; capped at 200. */
export function reminderSendsPerRun(raw: string | undefined): number {
  const parsed = Number.parseInt(raw?.trim() ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, 200);
}
