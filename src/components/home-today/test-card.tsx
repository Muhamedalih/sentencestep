"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Lock, Quote, RotateCcw } from "lucide-react";

import { fill, withXp } from "@/components/home-today/format";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { LOCKED_CARD_BLUR } from "@/components/today/today-tasks";
import type { DailyQuest } from "@/lib/features/quests";
import { todayLocalISODate } from "@/lib/progress/streak";
import { SENTENCE_REVIEW_MINUTES } from "@/lib/sentence-bank/review";
import { readTodayTest } from "@/lib/today/run-state";
import type { TodayTestResult } from "@/lib/today/run-state";
import { cn } from "@/lib/utils";

/** How many little segments stand for the questions (the count itself is written next to them). */
const MAX_SEGMENTS = 5;

/** The card's box — the open card and the locked one are the same size, so the page fits the same either way. It sits inside Today's box and so takes that box's zoom, none of its own. */
const CARD_SURFACE =
  "flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border px-5 py-4 sm:px-6 sm:py-5 roomy:py-[clamp(0.625rem,1.8svh,1.25rem)]";

/**
 * "Test yourself on today's lessons": the day's sentence self-test as a card of its own on the new
 * Home page — a few sentences of today's lessons that come back with their text hidden. It is quiet
 * next to the tasks (an outline button, so the page keeps one solid one) and only a little richer
 * than a row: a brand-tinted surface, a round mark, one small segment per question. Done with every
 * sentence typed right, it turns into a calm tick. Done with some that did not stick (the result is
 * kept on this device), it says how many did and offers another round — in the tone of "one short
 * round locks in the rest", never of a failing mark. A device with no stored result shows the plain
 * "done" card with the same way back in. The parent draws it only on a day a test was dealt.
 * With the Home polish permission the open card's button is solid: it is the last task of the day, and nothing
 * else on the page is left to press.
 */
export function TestYourselfCard({ quest, className }: { quest: DailyQuest; className?: string }) {
  const { t } = useLocale();
  const copy = t.today;
  const done = quest.completed;
  const solid = useFeatures().rollouts.homePolish && !done;
  // Read after mount (it lives in this browser only), so the first paint matches the server's.
  const [stored, setStored] = useState<TodayTestResult | null>(null);
  useEffect(() => {
    if (done) setStored(readTodayTest(todayLocalISODate()));
  }, [done]);
  const info = quest.today;
  if (!info) return null;

  const perfect = done && stored !== null && stored.clean === stored.total;
  const known = done && stored !== null && !perfect;
  const again = done && !perfect;
  const count = Math.max(1, quest.target);
  const countText = count === 1 ? copy.testOne : fill(copy.testMany, { n: count });
  const minutes = fill(copy.minutes, { n: info.minutes });
  const title = perfect
    ? copy.testPerfect
    : known
      ? stored.clean === 0
        ? copy.testRetryNone
        : fill(copy.testRetryTitle, { n: stored.clean, total: stored.total })
      : done
        ? copy.testDone
        : copy.taskSentences;
  // Green only for a finished test with nothing left to do (or one whose result is unknown here).
  const calm = done && !known;
  const href = again ? `${info.href}?retry=1` : info.href;

  const body = (
    <>
      <span
        className={cn(
          "roomy:size-11 grid size-12 shrink-0 place-items-center rounded-full ring-1",
          calm
            ? "bg-success/15 text-success ring-success/25"
            : "bg-primary/15 text-primary ring-primary/25",
        )}
        aria-hidden="true"
      >
        {calm ? (
          <Check className="size-6" strokeWidth={2} />
        ) : known ? (
          <RotateCcw className="size-5" strokeWidth={1.8} />
        ) : (
          <Quote className="size-5" strokeWidth={1.8} />
        )}
      </span>
      <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-4rem)]">
        <h3 className={cn("text-base font-semibold", calm && "text-success")}>
          <span dir="auto">{title}</span>
        </h3>
        {!done && (
          <>
            <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
              <span dir="auto">{copy.whySentences}</span>
            </p>
            <p className="text-muted-foreground roomy:mt-[clamp(0.25rem,0.9svh,0.625rem)] mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
              <span className="flex items-center gap-1" aria-hidden="true">
                {Array.from({ length: Math.min(count, MAX_SEGMENTS) }, (_unused, index) => (
                  <span key={index} className="bg-primary/45 h-1.5 w-5 rounded-full" />
                ))}
              </span>
              <span dir="auto">
                {countText} · {minutes}
                {quest.xp > 0 && <> · {withXp(copy.xpChip, quest.xp)}</>}
              </span>
            </p>
          </>
        )}
      </div>
      {(!done || again) && (
        <span
          className={cn(
            "inline-flex h-11 shrink-0 items-center justify-center rounded-[10px] border px-6 text-sm font-semibold transition-colors max-sm:w-full",
            solid
              ? "border-primary bg-primary text-primary-foreground group-hover:bg-primary/90"
              : "border-primary/50 text-primary group-hover:bg-primary/10",
          )}
        >
          <span dir="auto">{done ? copy.retakeTest : copy.startSentences}</span>
        </span>
      )}
    </>
  );

  const surface = cn(
    CARD_SURFACE,
    calm ? "border-success/30 bg-success/[0.06]" : "border-primary/25 bg-brand-muted/35",
    className,
  );

  if (perfect) {
    return (
      <section aria-label={copy.taskSentences} className={surface}>
        {body}
      </section>
    );
  }
  return (
    <section aria-label={copy.taskSentences}>
      <Link
        href={href}
        className={cn(
          surface,
          "group focus-visible:ring-ring transition-colors outline-none focus-visible:ring-2",
        )}
      >
        {body}
      </Link>
    </section>
  );
}

/**
 * The self-test card before the day's three tasks are done: the card as it will look, slightly
 * blurred and not a link, with one short line over it that says what opens it — so a learner sees
 * from the first moment what finishing the tasks earns. Only the line is read out; the blurred card
 * behind it is for the eye. Same box as the open card (CARD_SURFACE), so the page fits the same.
 */
export function LockedTestCard({ className }: { className?: string }) {
  const { t } = useLocale();
  const copy = t.today;
  const minutes = fill(copy.minutes, { n: SENTENCE_REVIEW_MINUTES });
  return (
    <section
      aria-label={copy.taskSentences}
      className={cn(
        CARD_SURFACE,
        "border-primary/25 bg-brand-muted/35 relative overflow-hidden",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none flex w-full flex-wrap items-center gap-x-5 gap-y-4",
          LOCKED_CARD_BLUR,
        )}
      >
        <span className="roomy:size-11 bg-primary/15 text-primary ring-primary/25 grid size-12 shrink-0 place-items-center rounded-full ring-1">
          <Quote className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-4rem)]">
          <h3 className="text-base font-semibold">
            <span dir="auto">{copy.taskSentences}</span>
          </h3>
          <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
            <span dir="auto">{copy.whySentences}</span>
          </p>
          <p className="text-muted-foreground roomy:mt-[clamp(0.25rem,0.9svh,0.625rem)] mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
            <span className="flex items-center gap-1">
              {Array.from({ length: 3 }, (_unused, index) => (
                <span key={index} className="bg-primary/45 h-1.5 w-5 rounded-full" />
              ))}
            </span>
            <span dir="auto">{minutes}</span>
          </p>
        </div>
        <span className="border-primary/50 text-primary inline-flex h-11 shrink-0 items-center justify-center rounded-[10px] border px-6 text-sm font-semibold max-sm:w-full">
          <span dir="auto">{copy.startSentences}</span>
        </span>
      </div>
      <p className="absolute inset-0 flex items-center justify-center gap-2 px-4 text-center text-sm font-semibold">
        <Lock className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
        <span dir="auto">{copy.testLocked}</span>
      </p>
    </section>
  );
}
