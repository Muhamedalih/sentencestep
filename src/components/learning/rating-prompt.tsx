"use client";

import { useEffect, useState } from "react";

import { RatingModal } from "@/components/learning/rating-modal";
import { trackRatingPromptShownAction } from "@/lib/analytics/track-actions";
import { recordPromptShown, shouldShowRatingPrompt } from "@/lib/feedback/rating-storage";
import type { LearningMode } from "@/types/content";

/**
 * The automatic trigger for RatingModal — shown over the ordinary
 * LessonCompletion screen, never over OnboardingLessonComplete. First shows
 * the moment a learner finishes their second lesson ever; if they skip
 * without rating, a bounded number of later re-asks can happen at real
 * milestones instead (see lesson-session.tsx's eligibleForRatingPrompt and
 * rating-storage.ts's MAX_PROMPT_SHOWS) — never shown once genuinely rated,
 * and never more than MAX_PROMPT_SHOWS times total regardless of outcome.
 * `show` only ever asks "are the app-level conditions met right now" (see
 * LessonSession's own eligibility check); this component owns the actual
 * bounded-retry gate itself via rating-storage, and spends one re-ask the
 * instant it becomes visible — not on submit/skip — so a learner who closes
 * the tab mid-decision is treated the same as one who explicitly skipped.
 * Settings' always-available "Rate SentenceStep" card (RateAppCard) opens
 * the same RatingModal directly instead, deliberately bypassing this gate.
 */
export function RatingPrompt({
  show,
  lessonId,
  mode,
  triggerReason,
}: {
  /** Whether the app-level conditions for showing this at all are met right now — see LessonSession's own eligibility check. */
  show: boolean;
  lessonId: string;
  mode: LearningMode;
  /** Why `show` just became eligible — purely for analytics (RatingModal's own behavior never depends on it). */
  triggerReason: "first" | "milestone";
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show || !shouldShowRatingPrompt()) return;
    recordPromptShown();
    setVisible(true);
    void trackRatingPromptShownAction(triggerReason);
  }, [show, triggerReason]);

  return <RatingModal open={visible} onOpenChange={setVisible} lessonId={lessonId} mode={mode} />;
}
