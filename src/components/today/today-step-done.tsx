"use client";

import Link from "next/link";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { buttonVariants } from "@/components/ui/button";
import type { CompletionSaveStatus } from "@/hooks/use-progress";
import { ruleStrings } from "@/lib/daily-rule/strings";
import { cn } from "@/lib/utils";

/** The accuracy that earns the story's star. */
const STAR_ACCURACY = 0.9;

/**
 * What a learner sees when a step of Today's session is done and another one follows — one calm
 * card, centred, with one big button to carry on and a quiet way to stop here (Home then shows the
 * steps still waiting). Used after the story; the passage's own finish screen offers the same
 * button for the listening step. The card is the same shape as the sentence exam's, and it fits a
 * laptop screen with room to spare.
 */
export function TodayStepDone({
  step,
  accuracy,
  saveStatus,
  onRetrySave,
  ruleHref,
}: {
  step: "listen" | "story";
  /** The story's typing accuracy (0-1): at 90% or more it earns a star. */
  accuracy?: number;
  saveStatus: CompletionSaveStatus;
  onRetrySave?: () => void;
  /** The rule of the day from this story: offered only for a story at level 1 while the permission is open. */
  ruleHref?: string;
}) {
  const { t, locale } = useLocale();
  const copy = t.today;
  const rule = ruleStrings(locale);
  const starred = accuracy !== undefined && accuracy >= STAR_ACCURACY;
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="border-border/60 bg-card flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border px-6 py-8 text-center shadow-sm sm:px-9 sm:py-10">
        <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <span className="border-success/40 bg-success/[0.14] text-success grid size-11 shrink-0 place-items-center rounded-full border">
            <Check aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </span>
          <span dir="auto">{step === "story" ? copy.stepDoneStory : copy.stepDoneListen}</span>
        </h2>

        {step === "story" && accuracy !== undefined && (
          <p
            className={cn(
              "text-sm font-medium",
              starred
                ? "border-success/40 bg-success/10 text-success rounded-full border px-4 py-1.5 font-semibold"
                : "text-muted-foreground",
            )}
          >
            <span dir="auto">
              {(starred ? copy.stepDoneStar : copy.stepDoneAccuracy).replace(
                "{n}",
                String(Math.round(accuracy * 100)),
              )}
            </span>
          </p>
        )}

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

        <div className="mt-2 flex w-full flex-col items-stretch gap-2">
          {ruleHref && step === "story" && (
            <Link
              href={ruleHref}
              prefetch={false}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-auto w-full flex-col gap-0.5 py-3")}
            >
              <span dir="auto">{rule.buttonTitle}</span>
              <span className="text-muted-foreground text-xs font-normal" dir="auto">
                {rule.buttonHint}
              </span>
            </Link>
          )}
          <Link
            href={`/learn/today/go?step=${step === "story" ? "words" : "story"}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            <span dir="auto">{step === "story" ? copy.continueWords : copy.continueStory}</span>
          </Link>
          <Link
            href="/learn"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground mx-auto",
            )}
          >
            <span dir="auto">{copy.stopHere}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
