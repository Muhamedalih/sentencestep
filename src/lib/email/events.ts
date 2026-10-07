import {
  getLessonCountMilestone,
  getStreakMilestone,
  INACTIVITY_THRESHOLD_DAYS,
} from "@/lib/email/milestones";
import type { LearningMode } from "@/types/content";

// --- The notification event model. ---
//
// Centralized and typed rather than scattered ad-hoc email triggers
// through components — see notification-triggers.ts, which is the only
// place that constructs these from real progress data.

export type NotificationEventType =
  | "LESSON_COMPLETED"
  | "STORY_COMPLETED"
  | "CONVERSATION_COMPLETED"
  | "LEVEL_COMPLETED"
  | "STREAK_MILESTONE"
  | "INACTIVE_LEARNER"
  | "INACTIVE_LEARNER_PUSH"
  | "PREMIUM_EXPIRY_REMINDER";

export type NotificationEvent =
  | { type: "LESSON_COMPLETED"; totalCompleted: number }
  | { type: "STORY_COMPLETED"; lessonId: string }
  | { type: "CONVERSATION_COMPLETED"; lessonId: string }
  | {
      type: "LEVEL_COMPLETED";
      mode: LearningMode;
      level: number;
      /**
       * True when this learner is on the free plan and every lesson they can see
       * in the next level is Premium, so the email must not say the next level
       * is "ready" (see milestoneEmail). Absent for a Premium learner, for the
       * last level of a mode, and for events recorded before this existed.
       */
      nextLevelLocked?: boolean;
    }
  | { type: "STREAK_MILESTONE"; streak: number }
  | { type: "INACTIVE_LEARNER"; daysInactive: number }
  // A distinct type (not a reuse of INACTIVE_LEARNER) specifically so its
  // dedupe_key never collides with the email reminder's — a learner who
  // gets the email must still be able to get the push, and vice versa,
  // since email_preferences and push_subscriptions are independent opt-ins.
  | { type: "INACTIVE_LEARNER_PUSH"; daysInactive: number }
  // One reminder per stage (7 or 3 days before the end) per Premium period:
  // `periodEnd` is the ISO timestamp the access ends, so buying more days (which
  // moves the end) starts a fresh pair of reminders for the new end date.
  | { type: "PREMIUM_EXPIRY_REMINDER"; stage: 7 | 3; periodEnd: string };

/**
 * Whether this event clears the bar for "meaningful" — the single place
 * that decides, so nothing downstream has to re-derive it. Ordinary
 * lessons are gated by count (a single one-sentence lesson isn't much),
 * while a full story, conversation, or level is substantial enough on its
 * own every time.
 */
export function shouldNotify(event: NotificationEvent): boolean {
  switch (event.type) {
    case "LESSON_COMPLETED":
      return getLessonCountMilestone(event.totalCompleted) !== null;
    case "STORY_COMPLETED":
    case "CONVERSATION_COMPLETED":
    case "LEVEL_COMPLETED":
      return true;
    case "STREAK_MILESTONE":
      return getStreakMilestone(event.streak) !== null;
    case "INACTIVE_LEARNER":
    case "INACTIVE_LEARNER_PUSH":
      return event.daysInactive >= INACTIVITY_THRESHOLD_DAYS;
    // Eligibility (an active, dated Premium period inside the window) is decided
    // where the reminders are planned — see src/lib/billing/expiry-reminders.ts.
    case "PREMIUM_EXPIRY_REMINDER":
      return true;
    default:
      return false;
  }
}

/** A coarse, deterministic ~7-day bucket — not calendar-precise, just enough to let an inactivity reminder recur weekly instead of once ever or every single day. */
function weekBucket(date: Date): number {
  const daysSinceEpoch = Math.floor(date.getTime() / 86_400_000);
  return Math.floor(daysSinceEpoch / 7);
}

/**
 * The deterministic key that makes the same logical milestone idempotent —
 * paired with a user_id, this is the unique constraint on
 * notification_events (see recordNotificationEvent). Pure and total: two
 * calls with equal input always produce the same key.
 */
export function dedupeKeyFor(event: NotificationEvent, now: Date = new Date()): string {
  switch (event.type) {
    case "LESSON_COMPLETED":
      return `LESSON_COMPLETED:${event.totalCompleted}`;
    case "STORY_COMPLETED":
      return `STORY_COMPLETED:${event.lessonId}`;
    case "CONVERSATION_COMPLETED":
      return `CONVERSATION_COMPLETED:${event.lessonId}`;
    case "LEVEL_COMPLETED":
      return `LEVEL_COMPLETED:${event.mode}:${event.level}`;
    case "STREAK_MILESTONE":
      return `STREAK_MILESTONE:${event.streak}`;
    case "INACTIVE_LEARNER":
      return `INACTIVE_LEARNER:${weekBucket(now)}`;
    case "INACTIVE_LEARNER_PUSH":
      return `INACTIVE_LEARNER_PUSH:${weekBucket(now)}`;
    case "PREMIUM_EXPIRY_REMINDER":
      return `PREMIUM_EXPIRY_REMINDER:${event.stage}:${event.periodEnd.slice(0, 10)}`;
  }
}
