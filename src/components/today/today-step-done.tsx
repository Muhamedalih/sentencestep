"use client";

import Link from "next/link";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { CompletionSaveStatus } from "@/hooks/use-progress";

const BUTTON =
  "inline-flex h-12 items-center justify-center rounded-[10px] px-6 text-[15px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * What a learner sees when a step of Today's session is done and another one follows — a calm
 * column with one big button to carry on and a quiet way to stop here (Home then shows the
 * steps still waiting). Used after the story; the passage's own finish screen offers the same
 * button for the listening step.
 */
export function TodayStepDone({
  step,
  saveStatus,
  onRetrySave,
}: {
  step: "listen" | "story";
  saveStatus: CompletionSaveStatus;
  onRetrySave?: () => void;
}) {
  const { t } = useLocale();
  const copy = t.today;
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 pt-4 pb-12 lg:px-6">
      <div className="flex w-full max-w-[560px] flex-col gap-3">
        <div className="mb-1 flex items-center gap-3.5">
          <span className="border-success/40 bg-success/[0.14] text-success grid size-11 shrink-0 place-items-center rounded-full border">
            <Check aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </span>
          <h2 className="text-[19px] font-semibold tracking-[-0.01em] lg:text-[22px]">
            <span dir="auto">{step === "story" ? copy.stepDoneStory : copy.stepDoneListen}</span>
          </h2>
        </div>

        {saveStatus === "saving" && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            <span dir="auto">{t.lesson.savingProgress}</span>
          </p>
        )}
        {saveStatus === "error" && (
          <div className="border-danger/40 bg-danger/10 text-danger flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span dir="auto">{t.lesson.saveFailed}</span>
            {onRetrySave && (
              <button
                type="button"
                onClick={onRetrySave}
                className="border-border hover:bg-muted text-foreground h-7 rounded-md border px-2.5 text-xs font-semibold"
              >
                {t.lesson.retry}
              </button>
            )}
          </div>
        )}

        <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href={`/learn/today/go?step=${step === "story" ? "words" : "story"}`}
            className={`${BUTTON} bg-primary text-primary-foreground hover:opacity-90 sm:flex-1`}
          >
            <span dir="auto">{step === "story" ? copy.continueWords : copy.continueStory}</span>
          </Link>
          <Link
            href="/learn"
            className={`${BUTTON} border-border text-foreground hover:bg-muted border`}
          >
            <span dir="auto">{copy.stopHere}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
