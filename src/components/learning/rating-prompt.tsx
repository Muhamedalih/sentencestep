"use client";

import { useEffect, useState } from "react";

import { RatingModal } from "@/components/learning/rating-modal";
import { hasRatedApp, markRatedApp } from "@/lib/feedback/rating-storage";
import type { LearningMode } from "@/types/content";

/**
 * The one-time automatic trigger for RatingModal — shown over the ordinary
 * LessonCompletion screen the moment a learner finishes their second lesson
 * ever, never over OnboardingLessonComplete, and never more than once per
 * browser regardless of outcome (rated, commented, or skipped all count the
 * same). `show` only ever asks "are the app-level conditions met right now"
 * (see LessonSession's own eligibility check); this component owns the
 * actual one-time gate itself via rating-storage, and sets that flag the
 * instant it becomes visible — not on submit/skip — so a learner who closes
 * the tab mid-decision still never sees it again. Settings' always-available
 * "Rate SentenceStep" card (RateAppCard) opens the same RatingModal directly
 * instead, deliberately bypassing this one-time gate.
 */
export function RatingPrompt({
  show,
  lessonId,
  mode,
}: {
  /** Whether the app-level conditions for showing this at all are met right now — see LessonSession's own eligibility check. */
  show: boolean;
  lessonId: string;
  mode: LearningMode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show || hasRatedApp()) return;
    markRatedApp();
    setVisible(true);
  }, [show]);

  return <RatingModal open={visible} onOpenChange={setVisible} lessonId={lessonId} mode={mode} />;
}
