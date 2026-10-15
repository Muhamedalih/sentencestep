"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { posterArtFor } from "@/lib/passages/art";
import type { PassageStatus } from "@/lib/passages/progress";
import type { PassageSummary } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * One passage on the list, as a poster: the title is the picture, on a colour of
 * its own (see posterArtFor), with its number, how long it takes and where the
 * learner stands. No illustrations and no mood labels — the hue carries the mood.
 * A one-line hook sits under the poster. The suggested next passage is marked
 * "Up next" — a pointer, never a lock: every passage is open.
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
  const art = posterArtFor(passage.tone, passage.order);

  const badge =
    status === "done"
      ? t.passages.done
      : status === "in-progress"
        ? t.passages.continue
        : isUpNext
          ? t.passages.upNext
          : null;

  return (
    <Link href={`/learn/passages/${passage.id}`} className="group block outline-none">
      <div
        className={cn(
          "relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/10 transition-all duration-300 dark:ring-white/10",
          "group-focus-visible:ring-primary group-hover:-translate-y-1 group-hover:shadow-xl group-focus-visible:ring-2",
        )}
        style={{ backgroundImage: art.backgroundImage }}
      >
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider text-white/60 tabular-nums">
            {String(passage.order).padStart(2, "0")}
          </span>
          {badge && (
            <span className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[0.7rem] font-semibold text-white backdrop-blur-sm">
              {status === "done" && <Check className="size-3" aria-hidden="true" />}
              <bdi>{badge}</bdi>
            </span>
          )}
        </div>

        <div className="absolute inset-x-4 bottom-4">
          <h3
            className="text-[1.4rem] leading-[1.15] font-semibold text-balance text-white"
            dir="ltr"
          >
            {passage.title}
          </h3>
          {locale === "ar" && (
            <p className="mt-1.5 text-sm text-white/75" dir="rtl" lang="ar">
              {passage.titleAr}
            </p>
          )}
          <p className="mt-3 text-xs font-medium text-white/65">
            <bdi>{t.passages.minutesShort.replace("{n}", String(passage.estimatedMinutes))}</bdi>
          </p>
        </div>
      </div>

      <p
        className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed"
        dir="ltr"
        title={passage.summary}
      >
        {passage.summary}
      </p>
    </Link>
  );
}
