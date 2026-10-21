"use client";

import { useRouter } from "next/navigation";

import { WordReviewSession } from "@/components/learning/word-review-session";
import type { ReviewWord } from "@/components/learning/word-review-session";
import { todayLocalISODate } from "@/lib/progress/streak";
import type { SessionLength } from "@/lib/today/plan";
import { writeTodayRun } from "@/lib/today/run-state";

/**
 * The review block of Today's session: the Daily session's fill-in-the-blank screen, but instead
 * of its own finish card it hands over the result and moves on to the next block (the new lesson,
 * or the finish screen when the session has no lesson). The result rides along in sessionStorage so
 * the finish screen can say how many words were remembered.
 */
export function TodayReviewRunner({
  words,
  defaultVoiceId,
  nextHref,
  length,
}: {
  words: ReviewWord[];
  defaultVoiceId: string | null;
  nextHref: string;
  length: SessionLength;
}) {
  const router = useRouter();
  return (
    <WordReviewSession
      words={words}
      defaultVoiceId={defaultVoiceId}
      variant="session"
      backHref="/learn"
      onFinished={(result) => {
        writeTodayRun({ date: todayLocalISODate(), length, review: result });
        router.push(nextHref);
      }}
    />
  );
}
