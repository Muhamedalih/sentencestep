"use server";

import { after } from "next/server";

import { isAdmin } from "@/lib/admin/access";
import { track } from "@/lib/analytics/track";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLessonSummaries } from "@/lib/content";
import { withOpeningLessonPlacement } from "@/lib/content-helpers";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { findCurrentLesson } from "@/lib/progress/level";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchProfileStartingLevel } from "@/lib/supabase/queries/profile";
import { fetchActiveMistakeCount, fetchDueReviewCountBy } from "@/lib/supabase/queries/mistakes";
import { fetchUserProgress } from "@/lib/supabase/queries/progress";
import type { LearningMode } from "@/types/content";

/** The lesson the finish screen offers next, already checked against what this learner can open. */
export interface SessionEndNextLesson {
  id: string;
  mode: LearningMode;
  title: string;
}

export interface SessionEndData {
  /** The recommended next lesson, or null when nothing is left that this learner can open. */
  next: SessionEndNextLesson | null;
  /** Words waiting at the end of tomorrow (corrected words whose review falls due, plus mistakes not yet fixed), capped at the Daily session's size. Only counted for a signed-in learner while the Daily session — the screen those words come back on — is open for them; 0 otherwise. */
  reviewTomorrow: number;
}

const NOTHING: SessionEndData = { next: null, reviewTomorrow: 0 };
const MAX_GUEST_IDS = 500;
const MAX_HORIZON_MS = 72 * 60 * 60 * 1000;

function isModeWithPath(mode: unknown): mode is Exclude<LearningMode, "conversation"> {
  return mode === "normal" || mode === "stories";
}

/**
 * What the finish screen needs that the lesson page didn't already know: the recommended next
 * lesson — by the same rule as Home (the learner's placement is a floor, see findCurrentLesson), not
 * the next one in catalog order, which for the opening lessons would skip most of a level — and how
 * many words come back tomorrow. One request per finished lesson, started while the recall round is
 * still on screen. A guest's finished lessons and placement live in their own browser, so the
 * caller sends them; a signed-in learner's are read from their account. It only changes which lesson
 * is suggested, so nothing sent can unlock anything. Never throws: any failure leaves the finish
 * screen without those two rows.
 */
export async function fetchSessionEndAction(input: {
  mode: LearningMode;
  lessonId: string;
  guestCompletedIds: string[];
  guestStartingLevel: number | null;
  /** The end of tomorrow in the learner's own time zone, as an instant. */
  tomorrowEndISO: string;
  /** For the SESSION_END_STARTED row this call also records (it is the first thing every finished lesson does here, so it costs no request of its own). */
  first: boolean;
  recall: boolean;
}): Promise<SessionEndData> {
  try {
    const { mode, lessonId, guestCompletedIds, guestStartingLevel, tomorrowEndISO, first, recall } =
      input;
    if (!isModeWithPath(mode) || typeof lessonId !== "string" || lessonId.length > 200) {
      return NOTHING;
    }

    const user = await getCurrentUser();
    after(() =>
      track(
        {
          name: "SESSION_END_STARTED",
          category: "ENGAGEMENT",
          properties: { first: first === true, recall: recall === true },
        },
        user?.id ?? null,
      ),
    );
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
        guestStartingLevel! >= 0 &&
        guestStartingLevel! <= 10
          ? guestStartingLevel
          : null;
    }

    const finished = [...new Set([...completedIds, lessonId])];
    const next = findCurrentLesson(
      withOpeningLessonPlacement(units),
      finished,
      premium || admin,
      startingLevel,
    );

    let reviewTomorrow = 0;
    const until = new Date(tomorrowEndISO);
    const horizon = until.getTime() - Date.now();
    if (
      user &&
      features.dailySession.enabled &&
      features.dailySession.sources.mistakesAndWeakWords &&
      Number.isFinite(horizon) &&
      horizon > 0 &&
      horizon <= MAX_HORIZON_MS
    ) {
      const [active, due] = await Promise.all([
        fetchActiveMistakeCount(user.id),
        fetchDueReviewCountBy(user.id, until),
      ]);
      reviewTomorrow = Math.min(features.dailySession.size, active + due);
    }

    return {
      next: next ? { id: next.id, mode: next.mode, title: next.title } : null,
      reviewTomorrow,
    };
  } catch (error) {
    console.error("[session-end] fetchSessionEndAction failed", error);
    return NOTHING;
  }
}
