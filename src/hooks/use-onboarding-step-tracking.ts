"use client";

import { useEffect } from "react";

import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { trackOnboardingStepAction } from "@/lib/analytics/track-actions";
import type { OnboardingStep } from "@/lib/first-run/variant";

const SESSION_KEY_PREFIX = "looma:firstRunStep:";

/** True the first time this browser tab reports `step`. Storage that can't be used lets every call through — a repeated row is better than a lost one. */
function isFirstReport(step: OnboardingStep): boolean {
  try {
    const key = `${SESSION_KEY_PREFIX}${step}`;
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Storage blocked.
  }
  return true;
}

/**
 * Records that this first-run screen was shown (see trackOnboardingStepAction), once per step per
 * browser tab, tagged with the visitor's first-run variant. Pass `visible` as the same condition
 * that makes the screen render, so the row means "this visitor saw it".
 */
export function useOnboardingStepTracking(step: OnboardingStep, visible: boolean): void {
  const { firstRunVariant } = useGetStartedStep();
  useEffect(() => {
    if (!visible || !firstRunVariant || !isFirstReport(step)) return;
    void trackOnboardingStepAction(step, firstRunVariant).catch(() => {});
  }, [step, visible, firstRunVariant]);
}
