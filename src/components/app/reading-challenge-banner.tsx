"use client";

import { PartyPopper, Target } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useLocale } from "@/components/providers/locale-provider";
import type { MonthlyReadingChallenge } from "@/lib/reading-challenge";

/**
 * Community, Step 2 (competitor report Section 6.3) — a monthly reading
 * challenge banner, shared by the Library and Novels homepages. `challenge`
 * is server-computed from data this app already tracks (book_progress),
 * never a new table — see fetchMonthlyReadingChallengeAction. Guest-only
 * rendered as nothing: book_progress, and therefore this challenge, has
 * been signed-in-only since it was first built, same scope as Continue
 * Reading.
 */
export function ReadingChallengeBanner({ challenge }: { challenge: MonthlyReadingChallenge }) {
  const { t, dir } = useLocale();
  const userId = useAuthUserId();
  if (!userId) return null;

  const percent = (challenge.completed / challenge.goal) * 100;

  return (
    <div
      className="border-border/60 bg-card flex items-center gap-4 rounded-2xl border p-4"
      dir={dir}
    >
      <div
        className={
          challenge.isComplete
            ? "bg-success/15 text-success flex size-10 shrink-0 items-center justify-center rounded-full"
            : "bg-brand-muted text-primary flex size-10 shrink-0 items-center justify-center rounded-full"
        }
        aria-hidden="true"
      >
        {challenge.isComplete ? <PartyPopper className="size-5" /> : <Target className="size-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {challenge.isComplete
            ? t.bookLibrary.monthlyChallengeCompleteHeading
            : t.bookLibrary.monthlyChallengeHeading.replace("{goal}", String(challenge.goal))}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <Progress value={percent} className="h-1.5" />
          <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
            {challenge.completed}/{challenge.goal}
          </span>
        </div>
      </div>
    </div>
  );
}
