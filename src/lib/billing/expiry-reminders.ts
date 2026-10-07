import { liveStreakDays, todayLocalISODate } from "@/lib/progress/streak";

const DAY_MS = 86_400_000;

/** How many days before the end a learner is first told their Premium is ending. */
export const REMINDER_WINDOW_DAYS = 7;

/** Only a streak at least this long is worth mentioning; a shorter one reads as pressure about nothing. */
export const MIN_STREAK_TO_MENTION = 3;

export type ReminderStage = 7 | 3;

/**
 * Which reminder a Premium period is due for right now: the 3-day one inside
 * the last three days, the 7-day one before that, nothing while the end is
 * further off or once it has passed. Windows rather than exact days, so a
 * scheduler run that is late or skipped for a day still sends the right one
 * and never a stale one.
 */
export function reminderStage(periodEnd: Date, now: Date): ReminderStage | null {
  const msLeft = periodEnd.getTime() - now.getTime();
  if (msLeft <= 0) return null;
  if (msLeft <= 3 * DAY_MS) return 3;
  if (msLeft <= REMINDER_WINDOW_DAYS * DAY_MS) return 7;
  return null;
}

export interface ExpiringSubscription {
  userId: string;
  /** ISO timestamp the Premium period ends. */
  periodEnd: string;
}

export interface StreakRow {
  user_id: string;
  current_streak: number;
  last_active_date: string | null;
}

export interface DueReminder {
  userId: string;
  stage: ReminderStage;
  periodEnd: string;
  /** Whole days left, rounded up. */
  daysLeft: number;
  /** The live streak, or 0 when it has lapsed or is too short to mention. */
  streak: number;
}

/** Pure: decides who is due which reminder, and which streak (if any) the message may quote. */
export function planExpiryReminders(input: {
  subscriptions: ExpiringSubscription[];
  streaks: StreakRow[];
  now: Date;
}): DueReminder[] {
  const { subscriptions, streaks, now } = input;
  const streakByUser = new Map(streaks.map((row) => [row.user_id, row]));
  const todayISO = todayLocalISODate(now);

  const due: DueReminder[] = [];
  for (const subscription of subscriptions) {
    const periodEnd = new Date(subscription.periodEnd);
    if (Number.isNaN(periodEnd.getTime())) continue;
    const stage = reminderStage(periodEnd, now);
    if (stage === null) continue;

    const row = streakByUser.get(subscription.userId);
    const live = row
      ? liveStreakDays(
          {
            currentStreak: row.current_streak,
            longestStreak: row.current_streak,
            lastActiveDate: row.last_active_date,
          },
          todayISO,
        )
      : 0;

    due.push({
      userId: subscription.userId,
      stage,
      periodEnd: subscription.periodEnd,
      daysLeft: Math.ceil((periodEnd.getTime() - now.getTime()) / DAY_MS),
      streak: live >= MIN_STREAK_TO_MENTION ? live : 0,
    });
  }
  return due;
}

/**
 * How many calendar days from `now` until `end`, counted in the runtime's own
 * time zone (the learner's browser when called from the app): 0 when it ends
 * today, 1 when it ends tomorrow. Used for the in-app banner's wording, where
 * "tomorrow" must mean the learner's tomorrow.
 */
export function calendarDaysUntil(end: Date, now: Date): number {
  const startOfEndDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfEndDay.getTime() - startOfToday.getTime()) / DAY_MS);
}
