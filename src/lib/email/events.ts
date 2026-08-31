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
  | "INACTIVE_LEARNER";

export type NotificationEvent =
  | { type: "LESSON_COMPLETED"; totalCompleted: number }
  | { type: "STORY_COMPLETED"; lessonId: string }
  | { type: "CONVERSATION_COMPLETED"; lessonId: string }
  | { type: "LEVEL_COMPLETED"; mode: LearningMode; level: number }
  | { type: "STREAK_MILESTONE"; streak: number }
  | { type: "INACTIVE_LEARNER"; daysInactive: number };

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
      return event.daysInactive >= INACTIVITY_THRESHOLD_DAYS;
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
  }
}
