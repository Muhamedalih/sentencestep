"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { StoryMonogram, StoryRibbon } from "@/components/app/story-cover-marks";
import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { fadeInUp } from "@/lib/motion";
import { TIER_CHIP_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types/content";

/**
 * The Stories Library's card — a reading-mark tile with no picture. Where the cover used to be,
 * the title's first letter is drawn as a faint outline and a bookmark ribbon in the level's colour
 * hangs from the top edge; the ribbon also carries the lock (a Premium story) or the check (a
 * finished one), and a locked card is simply dimmed. Below: the level chip, the title, the
 * translated title and the one-line hook from the lesson's own description (already written as a
 * hook, see src/data/lessons/stories.ts). On a phone the card becomes a row: a small tile with the
 * letter and ribbon, then the two titles, then the status.
 */
export function StoryCard({
  lesson,
  completed,
  isPremiumUser,
  openToday = false,
}: {
  lesson: Lesson;
  completed: boolean;
  isPremiumUser: boolean;
  /** This story is today's taste of the day for a free learner (see lib/hybrid): open for the day. */
  openToday?: boolean;
}) {
  const locked = !lesson.isFree && !isPremiumUser && !openToday;
  const { locale, t } = useLocale();
  const difficulty = difficultyForLevel(lesson.level);
  const tierText = locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label;
  const supportTitle = lesson.supportTitle ?? lesson.title;
  const hook = lesson.supportDescription ?? lesson.description;
  const status = locked ? "locked" : completed ? "completed" : null;

  return (
    <motion.div variants={fadeInUp} className="group h-full">
      <Link
        href={`/learn/stories/${lesson.id}`}
        aria-label={
          locked ? t.premium.lockedContentAriaLabel.replace("{title}", lesson.title) : lesson.title
        }
        className="focus-visible:ring-ring focus-visible:ring-offset-background block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div
          className={cn(
            "border-border/60 bg-card relative flex h-full min-h-64 w-full flex-col justify-end overflow-hidden rounded-2xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-[translate,border-color] duration-300",
            "hover:border-foreground/20 motion-safe:group-hover:-translate-y-1",
            "max-sm:min-h-0 max-sm:flex-row max-sm:items-center max-sm:justify-start max-sm:gap-3 max-sm:p-3",
          )}
        >
          <StoryMonogram
            title={lesson.title}
            className={cn(
              "absolute end-2 -top-2 text-[9.5rem] max-sm:hidden",
              locked && "opacity-60",
            )}
          />
          <StoryRibbon
            difficulty={difficulty}
            status={status}
            className="absolute start-3.5 top-0 h-11 w-[22px] pt-2 max-sm:hidden"
          />

          <span className="bg-primary/10 relative hidden h-[52px] w-11 shrink-0 items-center justify-center rounded-[10px] max-sm:flex">
            <StoryMonogram
              title={lesson.title}
              className="text-primary text-[1.65rem] [-webkit-text-stroke:0]"
            />
            <StoryRibbon
              difficulty={difficulty}
              className="absolute start-1.5 top-0 h-[22px] w-3"
            />
          </span>

          <div
            className={cn(
              "relative flex min-w-0 flex-col gap-1 p-4 max-sm:flex-1 max-sm:p-0",
              locked && "opacity-60",
            )}
          >
            <span
              className={cn(
                "mb-1 w-fit rounded-full border px-2 py-0.5 text-xs font-medium max-sm:hidden",
                TIER_CHIP_CLASS[difficulty],
              )}
            >
              {tierText}
            </span>
            {/* line-clamp-2 (not truncate) so a long title stays readable; the translated title
                stays on one line. The card is h-full in its grid cell, so every card in a row has
                the same height whatever its own title does. */}
            <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold" dir="ltr">
              {lesson.title}
            </h3>
            <p className="text-muted-foreground truncate text-xs" dir="auto">
              {supportTitle}
            </p>
            {hook && (
              <p
                className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed max-sm:hidden"
                dir="auto"
              >
                {hook}
              </p>
            )}
          </div>

          {status === "locked" && (
            <span className="border-border text-muted-foreground hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs max-sm:inline-flex">
              <Lock className="size-3" aria-hidden="true" />
              {t.premium.lockedChip}
            </span>
          )}
          {status === "completed" && (
            <span
              aria-hidden="true"
              className="bg-success text-success-foreground hidden size-6 shrink-0 items-center justify-center rounded-full max-sm:flex"
            >
              <Check className="size-3.5" />
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
