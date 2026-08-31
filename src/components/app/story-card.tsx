"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Check, Lock } from "lucide-react";

import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { useLocale } from "@/components/providers/locale-provider";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types/content";

/**
 * The Stories Library's card — a poster tile, not an info card: the
 * illustration fills the whole tile (a 4:3 crop — wide enough that a normal
 * 2-4 word title fits on one line, see the `truncate` below), with the
 * title/subtitle sitting directly on it over a bottom gradient —
 * deliberately unlike Word Lists' cards (see WordGroupCard), which are
 * text-and-badge tiles with no artwork at all. The two status chips
 * (tier, locked/completed) are styled as overlays-on-a-photo — a fixed
 * dark/translucent treatment, not the page's own light/dark theme tokens —
 * since they have to stay legible sitting on top of whatever the
 * illustration happens to look like, in either theme.
 *
 * showScene={false}: the hand-authored line-figure scenes (see
 * LessonIllustration) are borrowed from Normal-mode topics and, at this
 * thumbnail size, read as a meaningless dark blob rather than an
 * illustration — every card gets the same plain gradient face instead,
 * which is what actually looks intentional and consistent across a grid of
 * a dozen cards, rather than a dozen slightly-mismatched borrowed scenes.
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
  const tierText = locale
    ? tierSupportLabel(difficultyForLevel(lesson.level), locale)
    : tierLabel(difficultyForLevel(lesson.level)).label;
  const supportTitle = lesson.supportTitle ?? lesson.title;

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
            "border-border/60 relative aspect-[4/3] w-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300",
            locked
              ? "opacity-90"
              : "hover:shadow-xl hover:shadow-black/25 motion-safe:group-hover:-translate-y-1",
          )}
        >
          <LessonIllustration
            mode="stories"
            lessonId={lesson.id}
            title={lesson.title}
            illustrationUrl={lesson.illustrationUrl}
            showScene={false}
            className="absolute inset-0 aspect-[4/3] h-full w-full transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
          />

          {/* Fixed dark overlays, not theme tokens — this is a poster face,
              legible over any illustration/photo in either site theme, the
              same reasoning as the two status chips below. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          />

          <span className="absolute top-3 left-3 rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {tierText}
          </span>

          {(completed || locked) && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-3 right-3 flex size-8 items-center justify-center rounded-full shadow-sm",
                completed
                  ? "bg-success text-success-foreground"
                  : "border border-white/15 bg-black/40 text-white backdrop-blur-sm",
              )}
            >
              {completed ? <Check className="size-4" /> : <Lock className="size-3.5" />}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
            {!locked && (
              <span className="inline-flex w-fit items-center gap-1 text-xs font-medium text-white/70">
                <BookOpen className="size-3" aria-hidden="true" />
                {lesson.sentences.length} {t.lesson.sentencesUnit}
              </span>
            )}
            {/* truncate (not wrap) on both lines — a title that wrapped to
                a second line made that one card taller than its neighbors
                in the same row, breaking the grid's otherwise uniform card
                height; every card now has the exact same two-line text
                block regardless of title length. */}
            <h3 className="truncate leading-snug font-semibold text-white" dir="ltr">
              {lesson.title}
            </h3>
            <p className="truncate text-sm text-white/70" dir={dir}>
              {supportTitle}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
