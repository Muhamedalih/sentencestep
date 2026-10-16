"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PassageLinkButton } from "@/components/passages/passage-button";
import { PosterPicture } from "@/components/passages/poster-picture";
import { useLocale } from "@/components/providers/locale-provider";
import { posterArtFor } from "@/lib/passages/art";
import type { PassagesHomeData } from "@/lib/passages/home-card";
import { cn } from "@/lib/utils";

/**
 * Home's Passages card (feature "Passages"): the one passage to read next — the
 * one the learner has started, with how far they are, or the first they have not
 * started. The poster is the same generated one the Passages list shows, so the
 * two read as the same thing. The data is loaded with the page (see
 * startHomeEngagement) — null when Passages is not open to this visitor or there
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
      className={cn(
        "border-border/60 bg-card/60 flex items-center gap-4 rounded-2xl border p-3.5 sm:gap-5 sm:p-4",
        className,
      )}
    >
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative h-[4.75rem] w-[3.75rem] shrink-0 overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10"
        style={{ backgroundImage: art.backgroundImage }}
      >
        <PosterPicture src={passage.posterUrl} />
        <span className="absolute start-2 bottom-1.5 text-[0.7rem] font-semibold tracking-wider text-white/75 tabular-nums">
          {String(passage.order).padStart(2, "0")}
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <p
          className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
          dir={dir}
        >
          {continuing ? t.passages.homeContinue : t.passages.homeNext}
        </p>
        <h2 className="mt-1 truncate text-base leading-tight font-semibold" dir="ltr" lang="en">
          {passage.title}
        </h2>
        {locale === "ar" && (
          // Under the English title, on the same side — the card is laid out left to right.
          <p className="text-muted-foreground truncate text-sm" dir="ltr">
            <bdi lang="ar" dir="rtl">
              {passage.titleAr}
            </bdi>
          </p>
        )}
        <div className="text-muted-foreground mt-1.5 flex items-center gap-2.5 text-xs">
          {continuing ? (
            <>
              <span className="flex w-16 gap-1 sm:w-24" aria-hidden="true">
                {Array.from({ length: passage.sectionCount }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1 flex-1 rounded-full",
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

      <PassageLinkButton
        href={href}
        size="md"
        trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
        className="max-sm:px-3"
      >
        <span className="max-sm:sr-only">
          {continuing ? t.passages.continue : t.passages.homeStart}
        </span>
      </PassageLinkButton>
    </section>
  );
}
