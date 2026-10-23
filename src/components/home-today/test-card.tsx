"use client";

import Link from "next/link";
import { Check, Quote } from "lucide-react";

import { fill, withXp } from "@/components/home-today/format";
import { useLocale } from "@/components/providers/locale-provider";
import type { DailyQuest } from "@/lib/features/quests";
import { cn } from "@/lib/utils";

/** How many little segments stand for the questions (the count itself is written next to them). */
const MAX_SEGMENTS = 5;

/**
 * "Test yourself on today's lessons": the day's sentence self-test as a card of its own on the new
 * Home page — a few sentences of today's lessons and earlier days that come back with their text
 * hidden. It is quiet next to the tasks (an outline button, so the page keeps one solid one) and
 * only a little richer than a row: a brand-tinted surface, a round mark, one small segment per
 * question. Done, it turns into a calm tick. The parent draws it only on a day a test was dealt.
 */
export function TestYourselfCard({ quest, className }: { quest: DailyQuest; className?: string }) {
  const { t } = useLocale();
  const copy = t.today;
  const info = quest.today;
  if (!info) return null;
  const done = quest.completed;
  const count = Math.max(1, quest.target);
  const countText = count === 1 ? copy.testOne : fill(copy.testMany, { n: count });
  const minutes = fill(copy.minutes, { n: info.minutes });

  const body = (
    <>
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-full ring-1",
          done
            ? "bg-success/15 text-success ring-success/25"
            : "bg-primary/15 text-primary ring-primary/25",
        )}
        aria-hidden="true"
      >
        {done ? (
          <Check className="size-6" strokeWidth={2} />
        ) : (
          <Quote className="size-5" strokeWidth={1.8} />
        )}
      </span>
      <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-4rem)]">
        <h3 className={cn("text-base font-semibold", done && "text-success")}>
          <span dir="auto">{done ? copy.testDone : copy.taskSentences}</span>
        </h3>
        {!done && (
          <>
            <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
              <span dir="auto">{copy.whySentences}</span>
            </p>
            <p className="text-muted-foreground mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
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
      {!done && (
        <span className="border-primary/50 text-primary group-hover:bg-primary/10 inline-flex h-11 shrink-0 items-center justify-center rounded-[10px] border px-6 text-sm font-semibold transition-colors max-sm:w-full">
          <span dir="auto">{copy.startSentences}</span>
        </span>
      )}
    </>
  );

  const surface = cn(
    "flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border px-5 py-4 sm:px-6 sm:py-5",
    done ? "border-success/30 bg-success/[0.06]" : "border-primary/25 bg-brand-muted/35",
    className,
  );

  if (done) {
    return (
      <section aria-label={copy.taskSentences} className={surface}>
        {body}
      </section>
    );
  }
  return (
    <section aria-label={copy.taskSentences}>
      <Link
        href={info.href}
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
