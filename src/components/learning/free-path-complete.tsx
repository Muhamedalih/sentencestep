"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { FIRST_STEPS_LABEL } from "@/lib/progress/free-path";
import { popIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LearningMode } from "@/types/content";

/**
 * What a learner on the free plan sees on a Premium lesson once the free lessons of its
 * level are all done: a short acknowledgement of what they did, the lesson that waits behind
 * the lock, and one button. It replaces the ordinary lock only for someone who has earned
 * it; everyone else meets the short look at the content (LockedPreview) or the lock itself.
 *
 * On a laptop it is split — what they did on the left, what comes next on the right; on a
 * phone the two halves stack. Everything it says is true: the figures are the learner's own
 * (from their free lessons), the price is the cheapest real plan, and there is no countdown,
 * no scarcity and no promise about refunds or offers. The same single payment, no
 * auto-renewal, as every other lock.
 */
export function FreePathComplete({
  mode,
  lessonId,
  title,
  supportTitle,
  isNextLesson,
  chips,
  nextNumber,
  unitTitle,
  stats,
  fromPrice,
}: {
  mode: LearningMode;
  /** The Premium lesson the learner opened: the upgrade page is opened with it, so after paying they can go straight back to it. */
  lessonId: string;
  title: string;
  /** The lesson's title in the learner's language, when there is one. */
  supportTitle?: string;
  /** Whether that lesson is the one that follows their free lessons (otherwise the label says only that it is Premium). */
  isNextLesson: boolean;
  /** One label per free lesson they finished (see pathChips). */
  chips: string[];
  /** The number the lesson behind the lock would carry on the row of chips. */
  nextNumber: number;
  /** The curriculum unit's English name, when the lesson belongs to one. */
  unitTitle: string | null;
  stats: { sentences: number; words: number; days: number };
  /** The cheapest per-month USD price for this visitor's tier, e.g. "$1.17". */
  fromPrice: string;
}) {
  const { t } = useLocale();
  const [priceBefore = "", priceAfter = ""] = t.premium.fromPerMonthCaption.split("{amount}");
  const figures = [
    { value: stats.sentences, label: t.freePath.statSentences },
    { value: stats.words, label: t.freePath.statWords },
    { value: stats.days, label: t.freePath.statDays },
  ].filter((figure) => figure.value > 0);

  return (
    <motion.section
      variants={popIn}
      initial="hidden"
      animate="visible"
      aria-label={t.freePath.milestoneHeading}
      className="border-border bg-card mx-auto w-full max-w-4xl overflow-hidden rounded-[20px] border shadow-2xl shadow-black/15 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      {/* What they did. */}
      <div className="flex min-w-0 flex-col gap-3 p-5 md:p-7">
        <span
          dir="auto"
          className="bg-brand-muted text-primary inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
        >
          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
          {t.freePath.milestonePill}
        </span>
        <div>
          <h1
            dir="auto"
            className="text-xl leading-snug font-semibold tracking-tight md:text-[22px]"
          >
            {t.freePath.milestoneHeading}
          </h1>
          {unitTitle && (
            <p dir="ltr" className="text-muted-foreground mt-1 text-xs">
              {unitTitle}
            </p>
          )}
        </div>

        {/* One chip for each free lesson they finished, then the one behind the lock. */}
        <ol dir="ltr" className="flex gap-1.5">
          {chips.map((label, index) => (
            <li
              key={`${label}-${index}`}
              className={cn(
                "bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-0.5 rounded-md py-1.5 text-center text-[10px] font-medium whitespace-nowrap",
                label === FIRST_STEPS_LABEL && "flex-[1.6]",
              )}
            >
              <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
              {label}
            </li>
          ))}
          <li
            aria-hidden="true"
            className="border-border text-muted-foreground flex flex-1 items-center justify-center gap-0.5 rounded-md border border-dashed py-1.5 text-center text-[10px] font-medium"
          >
            <Lock className="size-2.5" />
            {nextNumber}
          </li>
        </ol>

        {figures.length > 0 && (
          <dl
            className="border-border grid border-t pt-3 text-center"
            style={{ gridTemplateColumns: `repeat(${figures.length}, minmax(0, 1fr))` }}
          >
            {figures.map((figure, index) => (
              <div key={figure.label} className={cn("px-2", index > 0 && "border-border border-s")}>
                <dd className="text-xl font-medium tabular-nums" dir="ltr">
                  {figure.value}
                </dd>
                <dt dir="auto" className="text-muted-foreground text-xs">
                  {figure.label}
                </dt>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* What comes next, and the one button. */}
      <div className="md:bg-muted/60 flex min-w-0 flex-col justify-center gap-3 p-5 pt-0 md:p-7">
        <p dir="auto" className="text-muted-foreground text-xs">
          {isNextLesson ? t.freePath.milestoneNextLabel : t.premium.premiumLessonBadge}
        </p>
        <div className="bg-muted md:border-border md:bg-card flex items-center gap-3 rounded-xl p-3 md:border">
          <span
            aria-hidden="true"
            className="bg-foreground/10 text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-[10px]"
          >
            <Lock className="size-4" />
          </span>
          <div className="min-w-0">
            <p dir="ltr" className="truncate text-sm font-medium">
              {title}
            </p>
            {/* Left-aligned under the English title, like the support title on the other lock screens. */}
            <p dir="auto" className="text-muted-foreground truncate text-start text-xs">
              {supportTitle ?? t.freePath.milestoneLockedNote}
            </p>
          </div>
        </div>
        <p dir="auto" className="text-muted-foreground text-sm">
          {t.freePath.milestoneBody}
        </p>
        <div className="flex flex-col gap-0.5">
          <p dir="auto" className="text-muted-foreground text-xs">
            {priceBefore.trim() && <span>{priceBefore.trim()} </span>}
            <span dir="ltr" className="text-foreground text-base font-semibold">
              {fromPrice}
            </span>
            {priceAfter.trim() && <span> {priceAfter.trim()}</span>}
          </p>
          <p dir="auto" className="text-muted-foreground text-xs">
            {t.freePath.milestonePriceNote}
          </p>
        </div>
        <Button asChild size="default" className="w-full">
          <Link
            href={`/upgrade?next=${encodeURIComponent(`/learn/${mode}/${lessonId}`)}`}
            dir="auto"
          >
            {t.freePath.milestoneCta}
          </Link>
        </Button>
        <Link
          href={`/learn/${mode}`}
          dir="auto"
          className="text-primary min-h-11 self-center rounded-md px-3 py-2 text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t.freePath.milestoneReview}
        </Link>
      </div>
    </motion.section>
  );
}
