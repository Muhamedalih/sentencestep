import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLessonSummaries } from "@/lib/content";
import { withOpeningLessonPlacement } from "@/lib/content-helpers";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { findCurrentLesson } from "@/lib/progress/level";
import { fetchProfileStartingLevel } from "@/lib/supabase/queries/profile";
import { fetchUserProgress } from "@/lib/supabase/queries/progress";
import type { LearningMode } from "@/types/content";

/** The lesson the finish screen offers next, already checked against what this learner can open. */
export interface SessionEndNextLesson {
  id: string;
  mode: LearningMode;
  title: string;
}

export const MAX_GUEST_IDS = 500;

export function isModeWithPath(mode: unknown): mode is Exclude<LearningMode, "conversation"> {
  return mode === "normal" || mode === "stories";
}

/**
 * The recommended next lesson after `lessonId`, by the same rule as Home (the learner's placement
 * is a floor, see findCurrentLesson), not the next one in catalog order. A guest's finished lessons
 * and placement live in their own browser, so the caller sends them; a signed-in learner's are read
 * from their account. It only changes which lesson is suggested, so nothing sent can unlock
 * anything. Shared by the lesson-ending screen and the return loop's card.
 */
export async function resolveNextLesson(input: {
  user: { id: string } | null;
  mode: Exclude<LearningMode, "conversation">;
  lessonId: string;
  guestCompletedIds: unknown;
  guestStartingLevel: unknown;
}): Promise<SessionEndNextLesson | null> {
  const { user, mode, lessonId, guestCompletedIds, guestStartingLevel } = input;
  const locale = await getLocale();
  const [units, features, premium, admin] = await Promise.all([
    getLessonSummaries(mode, locale ?? undefined),
    getEffectiveFeatures(),
    hasPremiumAccess(),
    isAdmin(),
  ]);

  let completedIds: string[];
  let startingLevel: number | null;
  if (user) {
    const [rows, level] = await Promise.all([
      fetchUserProgress(user.id),
      fetchProfileStartingLevel(user.id),
    ]);
    completedIds = rows
      .filter((row) => row.completed_at && row.mode === mode)
      .map((row) => row.lesson_id);
    startingLevel = level;
  } else {
    completedIds = Array.isArray(guestCompletedIds)
      ? guestCompletedIds
          .filter((id): id is string => typeof id === "string" && id.length <= 200)
          .slice(0, MAX_GUEST_IDS)
      : [];
    startingLevel =
      Number.isInteger(guestStartingLevel) &&
      (guestStartingLevel as number) >= 0 &&
      (guestStartingLevel as number) <= 10
        ? (guestStartingLevel as number)
        : null;
  }

  const finished = [...new Set([...completedIds, lessonId])];
  const next = findCurrentLesson(
    withOpeningLessonPlacement(units),
    finished,
    premium || admin,
    startingLevel,
    features.rollouts.levelFloor,
  );
  return next ? { id: next.id, mode: next.mode, title: next.title } : null;
}
