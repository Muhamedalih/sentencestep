"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";

import { PosterPicture } from "@/components/passages/poster-picture";
import { useLocale } from "@/components/providers/locale-provider";
import { posterArtFor } from "@/lib/passages/art";
import type { PassageStatus } from "@/lib/passages/progress";
import type { PassageSummary } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/**
 * One passage on the list, as a poster: the title is the picture, on a colour of
 * its own (see posterArtFor) — or on the picture an admin chose for the passage (see
 * PosterPicture) — with its number, how long it takes and where the learner stands. No
 * illustrations of our own and no mood labels — the hue carries the mood.
 * A one-line hook sits under the poster. The suggested next passage is marked
 * "Up next" — a pointer, never a lock. A Premium passage the viewer can't open says so
 * with a small "Premium" chip in the same place, and its picture is blurred right out (the
 * title, number and chip stay sharp and as readable as on every other card).
 */
export function PassageCard({
  passage,
  status,
  isUpNext,
  locked = false,
}: {
  passage: PassageSummary;
  status: PassageStatus;
  isUpNext: boolean;
  /** A Premium passage this viewer can't open: it still opens, onto the lock screen. */
  locked?: boolean;
}) {
  const { t, locale } = useLocale();
  const art = posterArtFor(passage.tone, passage.order);

  const badge = locked
    ? t.premium.lockedChip
    : status === "done"
      ? t.passages.done
      : status === "in-progress"
        ? t.passages.continue
        : isUpNext
          ? t.passages.upNext
          : null;

  return (
    <Link
      href={`/learn/passages/${passage.id}`}
      className="group block outline-none"
      aria-label={
        locked ? t.premium.lockedContentAriaLabel.replace("{title}", passage.title) : undefined
      }
    >
      <div
        className={cn(
          "relative aspect-[3/4] overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/10 transition-all duration-300 dark:ring-white/10",
          "group-focus-visible:ring-primary group-hover:-translate-y-1 group-hover:shadow-xl group-focus-visible:ring-2",
        )}
        style={{ backgroundImage: art.backgroundImage }}
      >
        <PosterPicture src={passage.posterUrl} blurred={locked} />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider text-white/60 tabular-nums">
            {String(passage.order).padStart(2, "0")}
          </span>
          {badge && (
            <span className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[0.7rem] font-semibold text-white backdrop-blur-sm">
              {locked && <Lock className="size-3" aria-hidden="true" />}
              {!locked && status === "done" && <Check className="size-3" aria-hidden="true" />}
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
