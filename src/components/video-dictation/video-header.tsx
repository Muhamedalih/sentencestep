"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { formatClipLength, shelfThumbnailUrl } from "@/lib/video-dictation/format";
import type { VideoStrings } from "@/lib/video-dictation/strings";

/** The red of the progress (a colour, not YouTube's logo): the player bar, the knob and the line under the picture. */
const RED = "bg-[#e04646]";

/** One of the first videos of the library: only what its picture and its length need. */
export interface HeaderPreview {
  youtubeId: string;
  vertical: boolean;
  clipSeconds: number;
}

/** The back picture leans and the front one stands; on a shake each wobbles a little, the back one the other way. */
const BACK = {
  rest: { rotate: -8, x: 0 },
  shake: { rotate: [-8, -13, -4, -12, -8], x: [0, -3, 2, -2, 0], transition: { duration: 0.55 } },
};
const FRONT = {
  rest: { rotate: 0, y: 0 },
  shake: { rotate: [0, -5, 5, -4, 3, 0], y: [0, -4, 0, -2, 0], transition: { duration: 0.6 } },
};

/**
 * The header of the video library in the "videoHeader" look (the approved mock-up of 2026-11-16, the
 * mini player of option 13 joined to the stacked pictures of option 14): one calm card with a small
 * red dot and «فيديو», the line that says why to watch, a small player bar under it, two stacked video
 * pictures on the side and the Admin's arrange button on the other. The player bar counts a second at a
 * time (0:41, 0:42, …) and its red line moves with it, and so does the thin line under the front
 * picture; when the pointer comes near the card the pictures give a short shake (a tap does it on a
 * phone). Everything that moves stops for a learner who asked for reduced motion, and the card then
 * shows a still player bar. The pictures are YouTube's own, the same ones the first shelf loads.
 */
export function VideoHeader({
  strings,
  action,
  previews,
}: {
  strings: VideoStrings;
  action?: ReactNode;
  previews: readonly HeaderPreview[];
}) {
  const reduced = useReducedMotion() ?? false;
  const front = previews[0];
  const back = previews[1];
  const total = Math.max(5, Math.round(front?.clipSeconds ?? 65));
  const [now, setNow] = useState(() => Math.round(total * 0.4));

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      setNow((current) => (current + 1 > total ? 0 : current + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [reduced, total]);

  const percent = (now / total) * 100;
  // Going back to the start is a jump, not a slide.
  const slide = (property: string) => (reduced || now === 0 ? "none" : `${property} 1s linear`);

  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover={reduced ? undefined : "shake"}
      whileTap={reduced ? undefined : "shake"}
      className="border-border bg-card mb-6 flex flex-col-reverse gap-4 overflow-hidden rounded-[18px] border px-5 py-5 sm:mb-8 sm:flex-row sm:items-center sm:gap-6 sm:px-7 sm:py-6"
    >
      {action}
      <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
        <div className="min-w-0 flex-1 text-right">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <span dir="auto">{strings.shelfEyebrow}</span>
            <span aria-hidden="true" className={`size-[7px] rounded-full ${RED}`} />
          </div>
          <h1
            className="mt-1.5 text-2xl leading-[1.25] font-bold tracking-[-0.01em] sm:text-[30px]"
            dir="auto"
          >
            {strings.shelfTitle}
          </h1>
          <p className="text-muted-foreground mt-1 text-base" dir="auto">
            {strings.shelfSubtitle}
          </p>
          <div
            aria-hidden="true"
            dir="ltr"
            className="mt-4 flex items-center justify-end gap-3 text-xs"
          >
            <svg viewBox="0 0 24 24" className="fill-foreground size-3.5 shrink-0">
              <path d="M7 4v16l13-8z" />
            </svg>
            <div className="bg-foreground/15 relative h-[3px] w-36 rounded-full sm:w-52">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${RED}`}
                style={{ width: `${percent}%`, transition: slide("width") }}
              />
              <div
                className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${RED}`}
                style={{ left: `${percent}%`, transition: slide("left") }}
              />
            </div>
            <span className="text-muted-foreground inline-flex tabular-nums">
              <motion.span
                key={now}
                initial={reduced ? false : { y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {formatClipLength(now)}
              </motion.span>
              <span>&nbsp;/&nbsp;{formatClipLength(total)}</span>
            </span>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="relative h-[104px] w-[84px] shrink-0 sm:h-[150px] sm:w-[110px]"
        >
          <motion.div
            variants={BACK}
            style={{ transformOrigin: "50% 100%" }}
            className="bg-muted border-border absolute top-[11px] left-0 h-[98px] w-[58px] overflow-hidden rounded-xl border sm:top-[14px] sm:h-[128px] sm:w-[76px]"
          >
            {back && <Picture preview={back} className="brightness-75" />}
          </motion.div>
          <motion.div
            variants={FRONT}
            style={{ transformOrigin: "50% 100%" }}
            className="bg-muted border-border absolute top-0 left-[22px] h-[104px] w-[58px] overflow-hidden rounded-xl border sm:left-[30px] sm:h-[136px] sm:w-[76px]"
          >
            {front && <Picture preview={front} />}
            <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45">
              <svg viewBox="0 0 24 24" className="size-3.5 fill-white">
                <path d="M7 4v16l13-8z" />
              </svg>
            </span>
            <span className="absolute right-1.5 bottom-2.5 rounded-[5px] bg-black/65 px-1 text-[11px] font-medium text-white tabular-nums">
              {formatClipLength(total)}
            </span>
            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25" />
            <span
              className={`absolute bottom-0 left-0 h-[3px] ${RED}`}
              style={{ width: `${percent}%`, transition: slide("width") }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function Picture({ preview, className }: { preview: HeaderPreview; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail, served by YouTube and never stored here
    <img
      src={shelfThumbnailUrl(preview.youtubeId, preview.vertical)}
      alt=""
      width={preview.vertical ? 480 : 320}
      height={preview.vertical ? 360 : 180}
      draggable={false}
      className={`h-full w-full object-cover ${className ?? ""}`}
    />
  );
}
