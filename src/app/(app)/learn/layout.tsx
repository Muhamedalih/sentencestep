import type { ReactNode } from "react";

import { KeyboardViewport } from "@/components/app/keyboard-viewport";
import { LearnerProviders } from "@/components/app/learner-providers";
import { SectionTimeTracker } from "@/components/app/section-time-tracker";
import { TimezoneCookie } from "@/components/app/timezone-cookie";

/**
 * Shared across every /learn/* route, including the full-screen lesson
 * player at /learn/[mode]/[lessonId] — only the learner's context (see
 * LearnerProviders: auth id, voice settings, typing sound settings,
 * pronunciation speed/Shift-replay state, the admin's colour overrides) and
 * a few invisible trackers live here, never dashboard chrome. The
 * header/sidebar are scoped to the "(dashboard)" route group instead (see
 * src/app/learn/(dashboard)/layout.tsx) precisely so the lesson player,
 * which sits outside that group, can render with no header or sidebar at
 * all.
 */
export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Tells the server the learner's time zone so Home can render its date-keyed cards up front — see TimezoneCookie. */}
      <TimezoneCookie />
      {/* Per-section (Stories / Daily Lessons / Word Lists / Passages) active time, reported to Clarity — see SectionTimeTracker. */}
      <SectionTimeTracker />
      <KeyboardViewport />
      <LearnerProviders>{children}</LearnerProviders>
    </>
  );
}
