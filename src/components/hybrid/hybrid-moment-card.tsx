"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { claimHybridMoment, trackHybridOffer } from "@/lib/hybrid/actions";
import type { HybridMoment } from "@/lib/hybrid/moments";

/**
 * A quiet card at a moment of satisfaction (see lib/hybrid/moments.ts): after today's taste, when
 * the day's three tasks are done, or after a story finished with 90% or more. It asks the server
 * first (the once-a-day rule and the other checks live there), so it appears only when allowed, and
 * it never covers the screen. «لاحقاً» closes it, and the close is counted with the taps.
 */
export function HybridMomentCard({
  moment,
  done,
  total,
  passages,
  stories,
}: {
  moment: HybridMoment;
  /** For D: how many of the day's tasks are done, out of how many. */
  done?: number;
  total?: number;
  /** How many Premium passages and stories the full plan opens (the catalog's own counts). */
  passages?: number;
  stories?: number;
}) {
  const { t } = useLocale();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let active = true;
    claimHybridMoment(moment)
      .then((allowed) => {
        if (active && allowed) setShown(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [moment]);

  if (!shown) return null;

  const title =
    moment === "D"
      ? t.hybrid.momentDTitle
          .replace("{done}", String(done ?? 0))
          .replace("{total}", String(total ?? 0))
      : moment === "star"
        ? t.hybrid.momentStarTitle
        : t.hybrid.momentBTitle;
  // B says the taste was free for today; D says what tomorrow brings; the star has no line of its own.
  const body = moment === "D" ? t.hybrid.momentDBody : moment === "B" ? t.hybrid.momentBody : null;

  return (
    <section className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-4 shadow-sm md:p-5">
      <p dir="auto" className="font-semibold">
        {title}
      </p>
      {body && (
        <p dir="auto" className="text-muted-foreground text-sm">
          {body}
        </p>
      )}
      {moment !== "D" && (
        <p dir="auto" className="text-sm leading-relaxed">
          {t.hybrid.momentFull
            .replace("{passages}", String(passages ?? 0))
            .replace("{stories}", String(stories ?? 0))}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link
            href="/upgrade"
            dir="auto"
            onClick={() => {
              void trackHybridOffer(moment, "clicked");
            }}
          >
            {t.hybrid.momentPrimary}
          </Link>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setShown(false);
            void trackHybridOffer(moment, "dismissed");
          }}
        >
          {t.hybrid.momentLater}
        </Button>
      </div>
    </section>
  );
}
