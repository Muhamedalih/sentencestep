"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { fadeInUp } from "@/lib/motion";
import { TIER_BADGE_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types/content";

/**
 * The Stories Library's card — a poster tile, not an info card. The cover
 * slot reuses LessonIllustration (mode="stories") rather than a per-lesson
 * icon: the same id-then-keyword-then-pool scene picker and admin-photo
 * override already built for Normal mode's 39 lessons (see that
 * component's own doc comment), so all ~120 Stories get an actual
 * illustrated cover with no new art produced per story and no ceiling on
 * how many stories the catalog can hold. Below the cover, a tier-tinted
 * teaser panel (a one-line hook pulled from the lesson's own description —
 * see the `hook` local below) and the title/subtitle. The two status chips
 * (tier, locked/completed) sit over the illustration — a fixed
 * dark/translucent treatment, not the page's own light/dark theme tokens —
 * since they have to stay legible over whatever the illustration paints
 * underneath, same as HomeLessonCard's equivalent badges.
 */
export function StoryCard({
  lesson,
  completed,
  isPremiumUser,
}: {
  lesson: Lesson;
  completed: boolean;
  isPremiumUser: boolean;
}) {
  const locked = !lesson.isFree && !isPremiumUser;
  const { locale, dir, t } = useLocale();
  const difficulty = difficultyForLevel(lesson.level);
  const tierText = locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label;
  const supportTitle = lesson.supportTitle ?? lesson.title;
  const hook = lesson.supportDescription ?? lesson.description;

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
            "border-border/60 bg-card relative flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-300",
            locked ? "opacity-90" : "hover:border-white/15 motion-safe:group-hover:-translate-y-1",
          )}
        >
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
            <LessonIllustration
              mode="stories"
              lessonId={lesson.id}
              title={lesson.title}
              illustrationUrl={lesson.illustrationUrl}
              className="aspect-[4/3] w-full transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
            />

            <span
              className={cn(
                "absolute top-2 left-2 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
                TIER_BADGE_CLASS[difficulty],
              )}
            >
              {tierText}
            </span>

            {(completed || locked) && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-2 right-2 flex size-6 items-center justify-center rounded-full shadow-sm",
                  completed
                    ? "bg-success text-success-foreground"
                    : "border border-white/15 bg-black/30 text-white backdrop-blur-sm",
                )}
              >
                {completed ? <Check className="size-3.5" /> : <Lock className="size-3" />}
              </span>
            )}
          </div>

          {/* line-clamp-2 (not truncate) on the title so the full text is
              readable up to two lines — CSS Grid's default row stretch
              (this div is h-full inside the grid cell) keeps every card in
              a row the same height regardless of whether its own title
              actually wraps to one line or two. The Arabic subtitle stays
              single-line/truncated: showing it in full isn't what was
              asked for here, and clamping both lines would make the tile
              noticeably taller than this fix calls for. */}
          <div className="flex flex-1 flex-col items-center gap-2 p-4 text-center">
            <div className="flex w-full flex-col items-center gap-0.5">
              <h3 className="line-clamp-2 w-full text-sm leading-snug font-semibold" dir="ltr">
                {lesson.title}
              </h3>
              <p className="text-muted-foreground w-full truncate text-xs" dir={dir}>
                {supportTitle}
              </p>
            </div>

            {hook && (
              // One line from the lesson's own description/supportDescription
              // (an existing content field, already written as a hook: see
              // src/data/lessons/stories.ts) — below the title, not replacing
              // it, and on a neutral/muted surface rather than the tier tint:
              // a full-width block of that color read as too loud repeated
              // across a whole grid of cards (verified live). Absent for any
              // lesson that doesn't have a description yet, so nothing shows
              // an empty box.
              <p
                className="border-foreground/10 bg-foreground/5 text-muted-foreground line-clamp-3 w-full rounded-xl border p-3 text-start text-sm leading-relaxed"
                dir={lesson.supportDescription ? dir : "ltr"}
              >
                {hook}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
