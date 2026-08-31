import { headers } from "next/headers";

import { getLessons } from "@/lib/content";
import { getLessonsByLevel } from "@/lib/content-helpers";
import { getEmailPreferences } from "@/lib/email/preferences";
import { shouldNotify } from "@/lib/email/events";
import {
  markNotificationEventSent,
  recordNotificationEvent,
} from "@/lib/email/notification-events";
import { sendTemplateEmail } from "@/lib/email/send";
import { milestoneEmail } from "@/lib/email/templates/milestone";
import type { MilestoneEvent } from "@/lib/email/templates/milestone";
import { getSiteUrl } from "@/lib/site-url";
import { getCurrentUser } from "@/lib/supabase/auth";
import type { ProgressState } from "@/lib/progress/types";
import type { LearningMode } from "@/types/content";

interface EventPlan {
  candidates: MilestoneEvent[];
  /** The completed lesson's level, resolved once here so callers (e.g. analytics) don't need a second content lookup. */
  level: number | null;
}

async function buildEvents(
  mode: LearningMode,
  lessonId: string,
  progress: ProgressState,
): Promise<EventPlan> {
  const candidates: MilestoneEvent[] = [];
  const completedIdsForMode = progress.completions
    .filter((completion) => completion.mode === mode)
    .map((completion) => completion.lessonId);

  if (mode === "normal") {
    candidates.push({ type: "LESSON_COMPLETED", totalCompleted: completedIdsForMode.length });
  } else if (mode === "stories") {
    candidates.push({ type: "STORY_COMPLETED", lessonId });
  } else if (mode === "conversation") {
    candidates.push({ type: "CONVERSATION_COMPLETED", lessonId });
  }

  const units = await getLessons(mode);
  const lesson = units.find((unit) => unit.id === lessonId);
  let level: number | null = null;

  if (lesson) {
    level = lesson.level;
    const levelLessons = getLessonsByLevel(units, lesson.level);
    const levelComplete =
      levelLessons.length > 0 &&
      levelLessons.every((item) => completedIdsForMode.includes(item.id));
    if (levelComplete) candidates.push({ type: "LEVEL_COMPLETED", mode, level: lesson.level });
  }

  candidates.push({ type: "STREAK_MILESTONE", streak: progress.streak.currentStreak });

  return { candidates: candidates.filter(shouldNotify), level };
}

export interface NotificationEvaluation {
  /** The completed lesson's level, or null if it couldn't be resolved. */
  level: number | null;
  /** Whether this completion finished every lesson in its level. */
  levelCompleted: boolean;
}

/**
 * Determines which milestone(s) a fresh lesson completion produced, then
 * records + (best-effort) emails each one. Called from
 * recordCompletionAction; every failure here is caught internally so a
 * notification-system problem (e.g. no service-role key configured, which
 * is expected in this environment) can never break lesson completion.
 *
 * Returns a small summary (level, whether a level just completed) so a
 * second consumer — analytics, see src/lib/analytics — can fire its own
 * LEVEL_COMPLETED event without re-deriving the same "is every lesson in
 * this level done" computation.
 */
export async function evaluateAndNotify(
  userId: string,
  mode: LearningMode,
  lessonId: string,
  progress: ProgressState,
): Promise<NotificationEvaluation> {
  try {
    const { candidates, level } = await buildEvents(mode, lessonId, progress);
    const levelCompleted = candidates.some((event) => event.type === "LEVEL_COMPLETED");

    if (candidates.length === 0) return { level, levelCompleted };

    const [preferences, user, originHeader] = await Promise.all([
      getEmailPreferences(userId),
      getCurrentUser(),
      headers().then((list) => list.get("origin")),
    ]);
    if (!user) return { level, levelCompleted };

    // Falls back to the configured production origin, not localhost — this
    // path runs from a Server Action, so a missing Origin header (an edge
    // case, not the common case) must never leak a dead localhost link into
    // an email actually delivered to a real user. See getSiteUrl's doc
    // comment for how that origin gets set.
    const origin = originHeader ?? getSiteUrl();

    for (const event of candidates) {
      if (!preferences.progressEmails) {
        await recordNotificationEvent(userId, event, "skipped");
        continue;
      }

      const record = await recordNotificationEvent(userId, event, "queued");
      if (record.status === "duplicate") continue;

      const content = milestoneEmail({ origin, displayName: user.displayName, event });
      const result = await sendTemplateEmail(user.email, content);
      if (result.status === "sent") {
        await markNotificationEventSent(record.id);
      }
    }

    return { level, levelCompleted };
  } catch (error) {
    console.error("[notifications] evaluateAndNotify failed", error);
    return { level: null, levelCompleted: false };
  }
}
