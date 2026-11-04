"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

import type { CardColors } from "./palette";

/** The small picture that peeks out of the card's foot: a page of lines, or a video frame. */
export type CategoryArt = "sheet" | "frame";

const ART_BOX = {
  background: "rgba(0,0,0,0.28)",
  borderColor: "rgba(255,255,255,0.28)",
} as const;

function SheetArt() {
  return (
    <div
      className="hc-tilt-l flex size-full flex-col gap-[0.55rem] rounded-2xl border p-[1.1rem]"
      style={ART_BOX}
    >
      <i
        className="block h-2 w-[52%] rounded"
        style={{ background: "var(--hc-accent)", opacity: 0.85 }}
      />
      <i className="block h-[7px] rounded bg-white/20" />
      <i className="hc-type relative block h-[7px] overflow-hidden rounded bg-white/20" />
      <i className="block h-[7px] rounded bg-white/20" />
      <i className="block h-[7px] w-[70%] rounded bg-white/20" />
    </div>
  );
}

function FrameArt() {
  return (
    <div
      className="hc-tilt-l relative grid size-full place-items-center overflow-hidden rounded-2xl border"
      style={ART_BOX}
    >
      <span
        className="hc-play mb-6 flex size-[3.1rem] items-center justify-center rounded-full border-[1.5px]"
        style={{ borderColor: "var(--hc-accent)" }}
      >
        <svg viewBox="0 0 24 24" className="ms-0.5 size-5 fill-white" aria-hidden="true">
          <path d="M6 4l14 8-14 8z" />
        </svg>
      </span>
      <span className="absolute inset-x-4 bottom-4 flex flex-col gap-[7px]">
        <i className="hc-type relative block h-2 overflow-hidden rounded bg-white/20" />
        <i className="block h-2 w-[70%] rounded bg-white/20" />
      </span>
    </div>
  );
}

/**
 * One of the Home cards that lead into a section (Passages, Video): a card of its own colour with
 * the section's name large, one line about it, the section's next item and a link, and a small
 * picture of the section peeking out of its foot. The whole card is the link. Under the pointer it
 * lifts, the picture rises and straightens and the little line in it types itself (see globals.css,
 * `hc-*`). `plain` makes the link a real page load (Video's pages carry YouTube in their own policy).
 */
export function CategoryCard({
  colors,
  art,
  kind,
  title,
  line,
  nextLabel,
  nextTitle,
  nextTitleExtra,
  cta,
  href,
  plain = false,
  badge,
  index = 0,
}: {
  colors: CardColors;
  art: CategoryArt;
  kind: string;
  title: string;
  line: string;
  nextLabel: string;
  nextTitle: string;
  /** The Arabic title beside the English one, when the learner reads Arabic. */
  nextTitleExtra?: string;
  cta: string;
  href: string;
  plain?: boolean;
  /** A small mark beside the kind (Video's «new»). */
  badge?: ReactNode;
  /** The place in the page's staggered entrance. */
  index?: number;
}) {
  const { dir } = useLocale();
  const className = cn(
    "hc-card hc-rise group relative isolate flex min-h-[13.75rem] min-w-0 flex-1 basis-[20rem] flex-col overflow-hidden rounded-2xl border p-5 text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70",
  );
  const style = {
    backgroundImage: colors.background,
    borderColor: colors.edge,
    "--hc-accent": colors.accent,
    "--hc-i": index,
  } as CSSProperties;

  const body = (
    <>
      <span className="absolute end-4 top-4 z-10 flex items-center gap-2">
        {badge}
        <span
          className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
          dir={dir}
        >
          {kind}
        </span>
      </span>
      <h3 className="relative z-10 text-[1.9rem] leading-tight font-bold tracking-tight" dir={dir}>
        {title}
      </h3>
      <p className="relative z-10 mt-1 text-sm" style={{ color: colors.soft }} dir={dir}>
        {line}
      </p>
      <p className="relative z-10 mt-3 flex min-w-0 items-baseline gap-2 text-sm">
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 self-center rounded-full"
          style={{ background: colors.accent }}
        />
        <span style={{ color: colors.soft }} dir={dir}>
          {nextLabel}
        </span>
        <bdi dir="ltr" className="truncate text-[15px] font-semibold">
          {nextTitle}
        </bdi>
        {nextTitleExtra && (
          <bdi dir="rtl" className="truncate text-xs" style={{ color: colors.soft }}>
            {nextTitleExtra}
          </bdi>
        )}
      </p>
      <span className="hc-go relative z-10 mt-auto inline-flex items-center gap-2 pt-4 font-semibold">
        <span dir={dir}>{cta}</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
      <div
        aria-hidden="true"
        className="hc-peek pointer-events-none absolute end-5 -bottom-10 h-[8.2rem] w-[10.5rem] xl:h-[9.4rem] xl:w-[14.4rem]"
      >
        {art === "sheet" ? <SheetArt /> : <FrameArt />}
      </div>
    </>
  );

  return plain ? (
    <a href={href} className={className} style={style}>
      {body}
    </a>
  ) : (
    <Link href={href} className={className} style={style}>
      {body}
    </Link>
  );
}
