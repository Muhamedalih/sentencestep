"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Maximize, Play, Settings, Subtitles, Volume2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

import { ORB, PAPER, VIDEO_SCENE } from "./palette";
import type { CardColors } from "./palette";
import { YouTubeIcon } from "./youtube-mark";

/** The picture that rises from the card's foot: a stack of paper sheets, or a video frame. */
export type CategoryArt = "sheet" | "frame";

/** A short stripe of the paper: a line of text, or one of the answers in the question box. */
function Stripe({
  color,
  width,
  className,
}: {
  color: string;
  width?: string;
  className?: string;
}) {
  return (
    <i
      className={cn("block h-1.5 rounded-[3px]", className)}
      style={{ background: color, width }}
    />
  );
}

/**
 * Passages: three white sheets with a real shadow, the next passage's title in a serif face, one line
 * highlighted in pale blue (it fills under the pointer), a small question with its answers, and the
 * round audio mark over the sheet's corner.
 */
function SheetArt({ title }: { title: string }) {
  return (
    <>
      <i
        className="absolute inset-0 rounded-lg"
        style={{
          background: PAPER.back2,
          transform: "translate(26px,-4px) rotate(6.5deg)",
          boxShadow: PAPER.stackShadow,
        }}
      />
      <i
        className="absolute inset-0 rounded-lg"
        style={{
          background: PAPER.back1,
          transform: "translate(13px,-2px) rotate(3.2deg)",
          boxShadow: PAPER.stackShadow,
        }}
      />
      <div
        className="hc-tilt-l absolute inset-0 rounded-lg px-[22px] py-5"
        style={{ background: PAPER.sheet, boxShadow: PAPER.shadow, color: PAPER.ink }}
      >
        <p dir="ltr" className="font-quote truncate text-lg leading-tight font-bold tracking-tight">
          {title}
        </p>
        <span
          className="mt-[7px] mb-3 block h-[3px] w-[34px] rounded-sm"
          style={{ background: PAPER.rule }}
        />
        <Stripe color={PAPER.line} className="mb-2" />
        <span
          className="hc-type relative -mt-1 mb-1 block h-3.5 overflow-hidden rounded-[3px]"
          style={{ "--hc-accent": PAPER.highlight } as CSSProperties}
        >
          <i
            className="absolute inset-x-0 top-1/2 z-10 block h-1.5 -translate-y-1/2 rounded-[3px]"
            style={{ background: PAPER.lineMarked }}
          />
        </span>
        <Stripe color={PAPER.line} className="mb-2" />
        <Stripe color={PAPER.line} width="72%" className="mb-2" />
        <div
          className="mt-[11px] rounded-[7px] border px-2.5 py-2"
          style={{ background: PAPER.box, borderColor: PAPER.boxEdge }}
        >
          <small
            className="mb-[7px] block text-[8.5px] leading-none font-bold tracking-[0.09em]"
            style={{ color: PAPER.boxLabel }}
          >
            QUESTION 3
          </small>
          <span className="mb-1.5 flex items-center gap-[7px]">
            <span
              className="size-[11px] shrink-0 rounded-[3px] border-[1.5px]"
              style={{ borderColor: PAPER.boxTick }}
            />
            <i
              className="block h-[5px] flex-1 rounded-[3px]"
              style={{ background: PAPER.boxOption }}
            />
          </span>
          <span className="flex items-center gap-[7px]">
            <span
              className="grid size-[11px] shrink-0 place-items-center rounded-[3px]"
              style={{ background: PAPER.boxRight }}
            >
              <svg viewBox="0 0 12 12" className="size-[8px]" fill="none" aria-hidden="true">
                <path
                  d="M2.5 6.3l2.3 2.3 4.7-5"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <i
              className="block h-[5px] flex-1 rounded-[3px]"
              style={{ background: PAPER.boxOptionRight }}
            />
          </span>
        </div>
      </div>
      <span
        className="absolute -start-[2.9rem] bottom-[4.4rem] flex size-16 items-center justify-center gap-[3.5px] rounded-full"
        style={{ background: ORB.background, boxShadow: ORB.shadow }}
      >
        {[13, 24, 34, 20, 11].map((height, i) => (
          <i
            key={i}
            className="hc-wave block w-1 rounded-sm"
            style={{
              height,
              background: ORB.bar,
              animationDelay: `${[0, 120, 240, 80, 200][i]}ms`,
            }}
          />
        ))}
      </span>
    </>
  );
}

/**
 * Video: the frame drawn as a YouTube player. A quiet shot (sky, hills, rain on the water), the title
 * strip on top with the channel's round picture, YouTube's dark play button in the middle (it turns
 * red and grows under the pointer), and the control row at the foot: the red progress line with its
 * dot (both move forward under the pointer), play, volume, the time, and captions, settings and full
 * screen on the far side.
 */
function FrameArt({ title }: { title: string }) {
  return (
    <div
      className="hc-tilt-l absolute inset-0 overflow-hidden rounded-xl"
      style={
        {
          boxShadow: VIDEO_SCENE.shadow,
          "--yt-red": VIDEO_SCENE.red,
          "--yt-rest": VIDEO_SCENE.playRest,
        } as CSSProperties
      }
    >
      <div className="absolute inset-0" style={{ background: VIDEO_SCENE.scene }} />
      <div
        className="absolute rounded-t-[50%]"
        style={{
          bottom: "42%",
          insetInlineStart: "-14%",
          width: "72%",
          height: "44%",
          background: VIDEO_SCENE.hillNear,
        }}
      />
      <div
        className="absolute rounded-t-[50%]"
        style={{
          bottom: "42%",
          insetInlineStart: "38%",
          width: "84%",
          height: "32%",
          background: VIDEO_SCENE.hillFar,
        }}
      />
      <div
        className="absolute inset-x-0 top-0 bottom-[42%]"
        style={{ background: VIDEO_SCENE.rain }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[40%]"
        style={{ background: VIDEO_SCENE.water }}
      />

      <div
        dir="ltr"
        className="absolute inset-x-0 top-0 flex items-center gap-2 px-3 pt-2.5 pb-7"
        style={{ background: VIDEO_SCENE.fadeTop }}
      >
        <i
          className="block size-[22px] shrink-0 rounded-full"
          style={{ background: VIDEO_SCENE.avatar }}
        />
        <span className="truncate text-[11px] font-medium text-white">{title}</span>
      </div>

      <YouTubeIcon
        className="hc-play absolute start-1/2 top-[40%] -ms-[27px] -mt-[19px] h-auto w-[54px]"
        bodyClassName="fill-(--yt-rest) transition-[fill] duration-300 group-hover:fill-(--yt-red) group-focus-visible:fill-(--yt-red)"
      />

      <div
        dir="ltr"
        className="absolute inset-x-0 bottom-0 px-3 pt-8 pb-[46px] text-white"
        style={{ background: VIDEO_SCENE.fadeBottom }}
      >
        <div className="relative flex h-[11px] items-center">
          <span
            className="hc-type relative block h-[3px] w-full overflow-hidden rounded-sm"
            style={
              { background: VIDEO_SCENE.track, "--hc-accent": VIDEO_SCENE.red } as CSSProperties
            }
          />
          <i
            className="absolute top-0 left-[calc(36%-5.5px)] block size-[11px] rounded-full transition-[left] duration-[800ms] ease-[cubic-bezier(0.3,0.7,0.2,1)] group-hover:left-[calc(88%-5.5px)] group-focus-visible:left-[calc(88%-5.5px)] motion-reduce:transition-none"
            style={{ background: VIDEO_SCENE.red }}
          />
        </div>
        <div className="mt-1.5 flex items-center gap-2.5 text-[10px] font-medium tabular-nums">
          <Play className="size-3 fill-white" aria-hidden="true" />
          <Volume2 className="size-3.5" aria-hidden="true" />
          <span>
            0:09 <span className="text-white/70">/ 0:25</span>
          </span>
          <span className="ms-auto flex items-center gap-2.5">
            <Subtitles className="size-3.5" aria-hidden="true" />
            <Settings className="size-3.5" aria-hidden="true" />
            <Maximize className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * One of the Home cards that lead into a section (Passages, Video): a card nearly the page's colour,
 * the section's name large, one line about it, the section's next item and a link, and the section's
 * picture rising from its foot. The whole card is the link. Under the pointer it lifts, the picture
 * rises and straightens and the little line in it fills (see globals.css, `hc-*`). On a narrower
 * card the picture is drawn smaller and the «next» line gives it room. `plain` makes the link a real
 * page load (Video's pages carry YouTube in their own policy).
 */
export function CategoryCard({
  colors,
  art,
  artTitle,
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
  /** The title written on the Passages sheet and on the Video player (the item the card leads to). */
  artTitle?: string;
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
    background: colors.background,
    borderColor: colors.edge,
    "--hc-accent": colors.accent,
    "--hc-i": index,
  } as CSSProperties;

  const body = (
    <>
      <span className="absolute end-4 top-4 z-10 flex items-center gap-2">
        {badge}
        <span
          className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
          style={{ background: colors.chip, borderColor: colors.chipEdge, color: colors.accent }}
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
      <p className="relative z-10 mt-3 flex max-w-[calc(100%-12.5rem)] min-w-0 items-baseline gap-2 text-sm xl:max-w-[calc(100%-18.25rem)]">
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
        className={cn(
          "hc-peek pointer-events-none absolute end-5 w-[16.75rem] xl:end-[1.9rem]",
          art === "sheet" ? "-bottom-14 h-[13.4rem]" : "-bottom-[1.9rem] h-[11.4rem]",
        )}
      >
        <div className="relative size-full origin-bottom-right max-xl:scale-[0.66]">
          {art === "sheet" ? (
            <SheetArt title={artTitle ?? nextTitle} />
          ) : (
            <FrameArt title={artTitle ?? nextTitle} />
          )}
        </div>
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
