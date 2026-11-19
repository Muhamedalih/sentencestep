"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Check, Lock } from "lucide-react";

import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { FALLBACK_PALETTE, PALETTES, storyScene } from "@/components/stories/story-cover-scenes";
import { difficultyForLevel } from "@/lib/levels";
import { fadeIn, fadeInUp } from "@/lib/motion";
import { TIER_DOT_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import type { Palette } from "@/components/words/word-cover-kit";
import type { Lesson } from "@/types/content";

const CEFR = { beginner: "A1", intermediate: "A2–B1", advanced: "B2+", expert: "C1" } as const;

function varsOf(p: Palette): CSSProperties {
  return {
    "--wc-bg": p.bg,
    "--wc-tint": p.tint,
    "--wc-ink": p.ink,
    "--wc-main": p.main,
    "--wc-alt": p.alt,
    "--wc-soft": p.soft,
    "--wc-pop": p.pop,
    background: p.bg,
  } as CSSProperties;
}

/**
 * A story as a cover, like a Word List topic (permission storyCovers): a 4:3 drawing in calm colours
 * made for the story, then its English title with the level, the title in the learner's language
 * and a thin bar (full once the story is finished). A locked story is drawn quieter and wears a
 * lock; a finished one wears a check.
 */
export function StoryCoverCard({
  lesson,
  completed,
  isPremiumUser,
  openToday = false,
}: {
  lesson: Lesson;
  completed: boolean;
  isPremiumUser: boolean;
  openToday?: boolean;
}) {
  const { dir, t } = useLocale();
  const { rollouts } = useFeatures();
  const reducedMotion = useReducedMotion() ?? false;
  const locked = !lesson.isFree && !isPremiumUser && !openToday;
  const difficulty = difficultyForLevel(lesson.level);
  const scene = storyScene(lesson.title, rollouts.storyCoversNew);
  const tones = scene?.palette ?? PALETTES[FALLBACK_PALETTE[lesson.level] ?? "green"]!;
  const supportTitle = lesson.supportTitle ?? lesson.title;
  const badge =
    "absolute top-2 left-2 flex size-7 items-center justify-center rounded-full border sm:top-2.5 sm:left-2.5";

  return (
    <motion.div variants={reducedMotion ? fadeIn : fadeInUp} className="group relative">
      <Link
        href={`/learn/stories/${lesson.id}`}
        prefetch={false}
        aria-label={
          locked ? t.premium.lockedContentAriaLabel.replace("{title}", lesson.title) : lesson.title
        }
        className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[14px] ring-1 ring-black/[0.06] transition-transform duration-[250ms] ring-inset motion-safe:group-hover:-translate-y-[3px] dark:ring-transparent">
          <span
            aria-hidden="true"
            className={cn("absolute inset-0 block", locked && "brightness-[.55] saturate-[.7]")}
            style={varsOf(tones)}
          >
            {scene ? (
              <svg
                viewBox="0 0 400 300"
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 size-full"
              >
                {scene.draw()}
              </svg>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center">
                <span
                  className="flex aspect-square h-3/5 items-center justify-center rounded-full"
                  style={{ background: "var(--wc-tint)" }}
                >
                  <BookOpen
                    className="size-1/2"
                    strokeWidth={1.5}
                    style={{ color: "var(--wc-main)" }}
                  />
                </span>
              </span>
            )}
          </span>
          {locked && (
            <span
              aria-hidden="true"
              className={cn(badge, "border-white/20 bg-black/60 text-white backdrop-blur-sm")}
            >
              <Lock className="size-3.5" />
            </span>
          )}
          {completed && !locked && (
            <span
              aria-hidden="true"
              className={cn(badge, "border-transparent text-white", TIER_DOT_CLASS[difficulty])}
            >
              <Check className="size-3.5" />
            </span>
          )}
        </span>
        <span className={cn("block pt-3", locked && "opacity-60")}>
          <span className="flex items-baseline justify-between gap-2.5">
            <h3
              className="min-w-0 truncate text-start text-[15.5px] leading-tight font-semibold tracking-[-0.005em] sm:text-[18px]"
              dir="ltr"
            >
              {lesson.title}
            </h3>
            <span
              className="text-muted-foreground shrink-0 text-[12.5px] tabular-nums sm:text-sm"
              dir="ltr"
            >
              {CEFR[difficulty]}
            </span>
          </span>
          <span
            className="text-muted-foreground mt-0.5 block truncate text-start text-[13px] sm:text-sm"
            dir={dir}
          >
            {supportTitle}
          </span>
          {completed && !locked && (
            <span className="bg-border mt-2.5 block h-1 overflow-hidden rounded-full">
              <span
                className={cn("block h-full w-full rounded-full", TIER_DOT_CLASS[difficulty])}
              />
            </span>
          )}
        </span>
      </Link>
    </motion.div>
  );
}
