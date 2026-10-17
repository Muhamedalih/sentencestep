"use client";

import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";

import { LevelBadge } from "@/components/passages/level-badge";
import { PassageLinkButton } from "@/components/passages/passage-button";
import { PosterPicture } from "@/components/passages/poster-picture";
import { useLocale } from "@/components/providers/locale-provider";
import { posterArtFor } from "@/lib/passages/art";
import type { PassagesHomeData } from "@/lib/passages/home-card";
import { cn } from "@/lib/utils";

/**
 * Home's Passages card (feature "Passages"): the one passage to read next — the
 * one the learner has started, with how far they are, or the first they have not
 * started. It sits under Home's "Up next" heading. The poster is the same generated one
 * (or the admin's own picture) the Passages list shows, here as a cover that runs the
 * card's full height; the passage's one-line hook fills the middle and its level sits
 * above the button. The whole card is one click target. The data is loaded with the page
 * (see startHomePassagesCard) — null when Passages is not open to this visitor or there
 * is nothing left to suggest, in which case nothing renders.
 */
export function PassagesCard({
  data,
  className,
}: {
  data: PassagesHomeData | null;
  className?: string;
}) {
  const { t, locale, dir } = useLocale();
  if (!data) return null;

  const { passage } = data;
  const art = posterArtFor(passage.tone, passage.order);
  const continuing = data.mode === "continue";
  const href = `/learn/passages/${passage.id}`;
  const partText = t.passages.partOf
    .replace("{n}", String(Math.min(data.sectionsDone + 1, passage.sectionCount)))
    .replace("{total}", String(passage.sectionCount));

  return (
    <section
      aria-label={t.passages.title}
      // Laid out left to right in every language, like the page around it.
      dir="ltr"
      className={cn(
        "border-border bg-card hover:border-primary/50 relative flex items-stretch overflow-hidden rounded-2xl border transition-colors",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="relative w-[5.5rem] shrink-0 overflow-hidden sm:w-[6.25rem]"
        style={{ backgroundImage: art.backgroundImage }}
      >
        <PosterPicture src={passage.posterUrl} />
        <span className="absolute start-2.5 bottom-2 text-[0.7rem] font-semibold tracking-wider text-white/75 tabular-nums">
          {String(passage.order).padStart(2, "0")}
        </span>
      </div>

      <div className="min-w-0 flex-1 px-4 py-3.5 sm:px-5 sm:py-4">
        <p className="text-primary flex items-center gap-1.5 text-sm font-semibold">
          <Headphones className="size-4 shrink-0" aria-hidden="true" />
          <span dir={dir}>{continuing ? t.passages.homeContinue : t.passages.homeNext}</span>
        </p>
        <h2
          className="mt-1 flex flex-wrap items-baseline gap-x-2.5 text-lg leading-tight font-semibold sm:text-[1.375rem]"
          dir="ltr"
          lang="en"
        >
          {passage.title}
          {locale === "ar" && (
            <bdi lang="ar" dir="rtl" className="text-muted-foreground text-sm font-normal">
              {passage.titleAr}
            </bdi>
          )}
        </h2>
        <p
          className="text-muted-foreground mt-1.5 truncate text-[0.8125rem] max-sm:hidden"
          dir="ltr"
          lang="en"
        >
          {passage.summary}
        </p>
        <div className="text-muted-foreground mt-2.5 flex items-center gap-2.5 text-[0.8125rem]">
          {continuing ? (
            <>
              <span className="flex w-24 gap-1 sm:w-[9.375rem]" aria-hidden="true">
                {Array.from({ length: passage.sectionCount }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      index < data.sectionsDone ? "bg-primary" : "bg-border",
                    )}
                  />
                ))}
              </span>
              <span dir={dir} className="whitespace-nowrap">
                <bdi>{partText}</bdi>
              </span>
            </>
          ) : (
            <span dir={dir}>
              <bdi>{t.passages.minutesShort.replace("{n}", String(passage.minutes))}</bdi>
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-3 py-3.5 pe-3.5 max-sm:justify-end sm:py-4 sm:pe-4">
        <span className="max-sm:hidden">
          <LevelBadge level={passage.level} size="sm" />
        </span>
        <PassageLinkButton
          href={href}
          size="md"
          trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
          className="z-10 max-sm:px-3"
        >
          <span className="max-sm:sr-only">
            {continuing ? t.passages.continue : t.passages.homeStart}
          </span>
        </PassageLinkButton>
      </div>

      {/* The rest of the card opens the passage too; the button above is the one keyboard and screen-reader users reach. */}
      <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0" />
    </section>
  );
}
