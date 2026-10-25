"use client";

import { useRouter } from "next/navigation";

import { WordReviewSession } from "@/components/learning/word-review-session";
import type { ReviewWord } from "@/components/learning/word-review-session";
import { todayLocalISODate } from "@/lib/progress/streak";
import { recordTodayWordsAction } from "@/lib/today/actions";
import { readTodayReview, writeTodayRun } from "@/lib/today/run-state";

/**
 * The words step of Today's session: the Daily session's fill-in-the-blank screen over five
 * words, but instead of its own finish card it hands the result on and goes to the finish screen.
 * The result is added to what earlier rounds of the same day found (the finish screen's "what you
 * remembered"), and kept in sessionStorage.
 */
export function TodayWordsRunner({
  words,
  defaultVoiceId,
}: {
  words: ReviewWord[];
  defaultVoiceId: string | null;
}) {
  const router = useRouter();
  return (
    <WordReviewSession
      words={words}
      defaultVoiceId={defaultVoiceId}
      variant="session"
      backHref="/learn"
      noBrowserVoice
      onFinished={(result) => {
        const today = todayLocalISODate();
        const before = readTodayReview(today);
        writeTodayRun({
          date: today,
          review: {
            clean: (before?.clean ?? 0) + result.clean,
            total: (before?.total ?? 0) + result.total,
          },
        });
        // The round is done: tick the day's words task (best-effort, never holds the learner up).
        void recordTodayWordsAction(today).catch(() => {});
        // The finish screen offers the day's test as an option; the day does not wait for it.
        router.push("/learn/today/end");
      }}
    />
  );
}
