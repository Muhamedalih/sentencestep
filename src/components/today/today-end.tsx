"use client";

import Link from "next/link";

import { SessionEndFlow } from "@/components/learning/session-end-flow";
import { Logo } from "@/components/layout/logo";
import { useLocale } from "@/components/providers/locale-provider";
import type { LessonCompletion } from "@/lib/progress/types";
import type { SessionLength } from "@/lib/today/plan";
import type { NextLessonRef } from "@/types/content";

/**
 * The finish screen of a Today session with no lesson in it (see the /learn/today/end route): the
 * lesson ending's own SessionEndFlow with nothing to recall (the review was the recall), so it
 * opens straight on the finish screen. A free learner who has run out of free lessons is offered the
 * next Premium one as a locked "extra", like after a lesson.
 */
export function TodayEnd({
  length,
  completions,
  startingLevel,
  lockedNext,
}: {
  length: SessionLength;
  completions: LessonCompletion[];
  startingLevel: number | null;
  lockedNext: NextLessonRef | null;
}) {
  const { t } = useLocale();
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <Link
        href="/learn"
        aria-label={t.marketing.dashboardLinkAriaLabel}
        className="flex shrink-0 items-center px-3 pt-2.5 pb-2"
      >
        <Logo size="sm" />
      </Link>
      <div className="flex min-h-0 flex-1 flex-col">
        <SessionEndFlow
          unit={{ id: "", mode: "normal" }}
          items={[]}
          nextLesson={lockedNext ?? undefined}
          nextLessonLocked={lockedNext !== null}
          completions={completions}
          startingLevel={startingLevel}
          saveStatus="idle"
          allowReveal={false}
          showFirstLetters={false}
          onMistakes={() => {}}
          today={{ length }}
        />
      </div>
    </div>
  );
}
