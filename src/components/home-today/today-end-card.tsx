"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { fill } from "@/components/home-today/format";
import { useLocale } from "@/components/providers/locale-provider";
import type { TodayEndInfo } from "@/lib/today/end-state";

/**
 * Today's box once nothing is left to open: the new Home draws it in place of the tasks. A free
 * learner finished the starter passages and stories (they are the whole free path of Today), and the
 * card says so calmly — the same line and the same quiet way to the plans as the starter-lessons card
 * (`premium.homeFreeCompleteBody`, `premium.seePlansCta`), as a text link so the page keeps no
 * second button. A Premium learner who finished everything is told that new ones will appear and
 * pointed to the word lists meanwhile. The box is the size and the frame of Today's tasks box, so the
 * page fits the same; the message sits in the middle of it where the box is taller.
 */
export function TodayEndCard({ end, className }: { end: TodayEndInfo; className?: string }) {
  const { t } = useLocale();
  const copy = t.today;
  const heading = end.premium ? copy.endAllHeading : copy.endFreeHeading;
  const body = end.premium ? copy.endAllBody : t.premium.homeFreeCompleteBody;
  const link = end.premium
    ? { href: "/learn/word-lists", label: t.nav.wordLists }
    : { href: "/upgrade", label: t.premium.seePlansCta };
  return (
    <section
      aria-label={heading}
      className={`border-border/60 bg-card roomy:p-[clamp(0.75rem,2svh,1.5rem)] roomy:[zoom:var(--home-zoom,1.1)] flex h-full flex-col justify-center rounded-2xl border p-4 sm:p-5 ${className ?? ""}`}
    >
      <header className="roomy:px-2 flex items-center justify-between gap-4 px-1">
        <div className="min-w-0">
          <h2 className="roomy:text-xl text-[17px] leading-snug font-semibold">
            <span dir="auto">{heading}</span>
          </h2>
          {!end.premium && (
            <p className="text-muted-foreground roomy:mt-1 roomy:text-sm mt-0.5 text-xs">
              <span dir="auto">
                {fill(copy.endCounts, { passages: end.passages, stories: end.stories })}
              </span>
            </p>
          )}
        </div>
        <span
          className="border-success text-success roomy:size-12 grid size-10 shrink-0 place-items-center rounded-full border-2"
          aria-hidden="true"
        >
          <Check className="roomy:size-6 size-5" strokeWidth={2} />
        </span>
      </header>
      <p className="text-muted-foreground roomy:px-2 roomy:text-[15px] mt-3.5 px-1 text-[13px] leading-relaxed">
        <span dir="auto">{body}</span>
      </p>
      <Link
        href={link.href}
        className="text-primary focus-visible:ring-ring roomy:mx-2 roomy:text-[15px] mx-1 mt-3 inline-flex w-fit items-center gap-1.5 rounded text-[13px] font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 pointer-coarse:min-h-11"
      >
        <span dir="auto">{link.label}</span>
        <ArrowRight className="size-4 shrink-0" aria-hidden="true" strokeWidth={1.8} />
      </Link>
    </section>
  );
}
