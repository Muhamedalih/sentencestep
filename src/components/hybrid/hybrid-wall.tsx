"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import type { GateProgress } from "@/lib/progress/honest-numbers";

/**
 * The lock screen for a Premium passage or story, as the hybrid offers draw it (see the mockup):
 * a preview of the text beside its title and length, one line on what the full plan opens, the
 * learner's own numbers, the full-plan button, and — when today's taste is open — a second button
 * back to it, so a locked text never ends in a dead end. The price is only named here (the amount is
 * on the plans page). Everything it says is true: the numbers come from the learner's own rows.
 */
export function HybridWall({
  poster,
  title,
  level,
  minutes,
  kind,
  progress,
  tasteToday,
  ctaHref,
  backHref,
}: {
  /** The text's picture, drawn in a box about 42% of the card's width. */
  poster: ReactNode;
  title: string;
  /** The level code (A1…B2 for a passage, the CEFR code for a story). */
  level: string;
  minutes: number;
  kind: "passage" | "story";
  progress: GateProgress | null;
  /** Today's taste is open: the strip says the next one comes tomorrow, and the back button shows. */
  tasteToday: boolean;
  ctaHref: string;
  backHref: string;
}) {
  const { t } = useLocale();
  // The strip: what the learner has written (with their days, when counted), then the taste's news.
  const written = progress
    ? (progress.days === null ? t.hybrid.wallWritten : t.hybrid.wallWrittenDays)
        .replace("{sentences}", String(progress.sentences))
        .replace("{days}", String(progress.days ?? 0))
    : null;

  return (
    <section className="border-border bg-card mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border p-5 shadow-sm md:p-6">
      <div className="flex items-stretch gap-4">
        <div
          className="relative h-36 w-[42%] shrink-0 overflow-hidden rounded-2xl"
          aria-hidden="true"
        >
          {poster}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h1 dir="auto" className="text-lg leading-snug font-semibold">
            {title}
          </h1>
          <p dir="auto" className="text-muted-foreground text-sm">
            {t.hybrid.wallMeta.replace("{level}", level).replace("{n}", String(minutes))}
          </p>
          <p dir="auto" className="text-sm leading-relaxed">
            {kind === "passage" ? t.hybrid.wallPassage : t.hybrid.wallStory}
          </p>
        </div>
      </div>

      {(written || tasteToday) && (
        <p dir="auto" className="bg-muted/60 text-muted-foreground rounded-xl px-3 py-2 text-sm">
          {[written, tasteToday ? t.hybrid.wallTasteTomorrow : null].filter(Boolean).join(" ")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href={ctaHref} dir="auto">
            {t.hybrid.wallPrimary}
          </Link>
        </Button>
        {tasteToday && (
          <Button asChild variant="ghost">
            <Link href={backHref} dir="auto">
              {t.hybrid.wallBack}
            </Link>
          </Button>
        )}
      </div>
      <p dir="auto" className="text-muted-foreground text-xs">
        {t.hybrid.wallPrice}
      </p>
    </section>
  );
}
