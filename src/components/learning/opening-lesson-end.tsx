"use client";

import { useState } from "react";

import { OnboardingLessonComplete } from "@/components/learning/onboarding-lesson-complete";
import { SignupPrompt } from "@/components/learning/signup-prompt";
import { readFirstRunVariantNow } from "@/lib/first-run/browser";

/**
 * What follows the opening lesson: the short first run's sign-up page (SignupPrompt), or the long
 * run's OnboardingLessonComplete for everyone else. The lesson page sits outside the first run's
 * step provider (see root-html-shell.tsx), so the version is read from where the browser keeps it —
 * once, when this mounts, which is only ever on the client, after the last sentence.
 */
export function OpeningLessonEnd({ words, accuracy }: { words: number; accuracy: number }) {
  const [variant] = useState(() => readFirstRunVariantNow());
  if (variant === "short") return <SignupPrompt words={words} accuracy={accuracy} />;
  return <OnboardingLessonComplete />;
}
