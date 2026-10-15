"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { PassageIcon } from "@/components/passages/passage-icons";
import { PASSAGE_TONE_STYLES } from "@/components/passages/passage-tone";
import { useLocale } from "@/components/providers/locale-provider";
import type { PassageStatus } from "@/lib/passages/progress";
import type { PassageSummary } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * One passage on the list: its mood-coloured icon, title and one-line hook, how
 * long it is, and where the learner stands (Start / Continue / Done). The
 * suggested next passage carries a small "Up next" label — a pointer, never a
 * lock: every passage is open.
 */
export function PassageCard({
  passage,
  status,
  isUpNext,
}: {
  passage: PassageSummary;
  status: PassageStatus;
  isUpNext: boolean;
}) {
  const { t, locale } = useLocale();
  const tone = PASSAGE_TONE_STYLES[passage.tone];
  const showArabic = locale === "ar";

  return (
    <Link
      href={`/learn/passages/${passage.id}`}
      className={cn(
        "group border-border bg-card relative flex h-full flex-col rounded-2xl border p-5 shadow-sm transition-all duration-200 outline-none",
        "hover:border-primary/40 focus-visible:ring-ring focus-visible:ring-offset-background hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2",
        isUpNext && "border-primary/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", tone.tile)}
        >
          <PassageIcon name={passage.icon} className="size-6" />
        </span>
        <div className="flex items-center gap-2">
          {isUpNext && status !== "done" && (
            <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold">
              {t.passages.upNext}
            </span>
          )}
          <span className={cn("rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold", tone.chip)}>
            {t.passages.tones[passage.tone]}
          </span>
        </div>
      </div>

      <h3 className="mt-4 text-lg leading-snug font-semibold" dir="ltr">
        {passage.title}
      </h3>
      {showArabic && (
        <p className="text-muted-foreground/80 mt-0.5 text-sm" dir="rtl" lang="ar">
          {passage.titleAr}
        </p>
      )}
      <div className="flex-1">
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed" dir="ltr">
          {passage.summary}
        </p>
        {showArabic && (
          <p className="text-muted-foreground/70 mt-1 text-sm leading-relaxed" dir="rtl" lang="ar">
            {passage.summaryAr}
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          {/* Each phrase is its own bidi island: in Arabic, "4 أجزاء · 5 د" would otherwise be re-ordered as one run and the numbers would swap sides. */}
          <bdi>{t.passages.partsCount.replace("{n}", String(passage.sectionCount))}</bdi>
          <span className="mx-1.5 opacity-50">·</span>
          <bdi>{t.passages.minutesShort.replace("{n}", String(passage.estimatedMinutes))}</bdi>
        </span>
        {status === "done" ? (
          <span className="text-success flex items-center gap-1 font-medium">
            <Check className="size-4" aria-hidden="true" />
            {t.passages.done}
          </span>
        ) : (
          <span className="text-primary flex items-center gap-1 font-medium">
            {status === "in-progress" ? t.passages.continue : t.passages.start}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        )}
      </div>
    </Link>
  );
}
