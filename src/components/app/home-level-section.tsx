"use client";

import { motion } from "framer-motion";
import { Compass, Flame, Sprout, type LucideIcon } from "lucide-react";

import { HomeLessonCard } from "@/components/app/home-lesson-card";
import { useLocale } from "@/components/providers/locale-provider";
import { staggerChildren } from "@/lib/motion";
import { resolveLevelSupportTitle } from "@/lib/content-helpers";
import type { Lesson } from "@/types/content";

/** Same icon set as start-simple-preview.tsx, keyed by position, so a level's identity reads consistently between the preview teaser above and its full section here. */
const LEVEL_ICONS: LucideIcon[] = [Sprout, Compass, Flame];
const LEVEL_COUNT = 3;

/**
 * One of the three Beginner/Intermediate/Advanced sections on the /learn
 * homepage — a heading plus exactly 4 lesson cards in a responsive grid
 * (see the Phase 2 redesign; src/data/lessons/normal.ts guarantees 4 per
 * level). Kept separate from lesson-list-view.tsx's UnitSection: that one
 * renders every level for a mode's dedicated list page, this one renders a
 * single level as a homepage section with the larger, image-led card.
 */
export function HomeLevelSection({
  id,
  title,
  titleAr,
  titleEs,
  description,
  descriptionAr,
  descriptionEs,
  level,
  lessons,
  completedCount,
  currentLessonId,
  isPremiumUser,
  isCompleted,
}: {
  id: string;
  title: string;
  titleAr: string;
  titleEs: string;
  description: string;
  descriptionAr: string;
  descriptionEs: string;
  level: number;
  lessons: Lesson[];
  completedCount: number;
  currentLessonId: string | undefined;
  isPremiumUser: boolean;
  isCompleted: (lessonId: string) => boolean;
}) {
  const Icon = LEVEL_ICONS[(level - 1) % LEVEL_ICONS.length]!;
  const { locale, dir } = useLocale();

  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="bg-brand-muted text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
              <span className="text-muted-foreground text-xs font-medium tabular-nums" dir="ltr">
                {level} / {LEVEL_COUNT}
              </span>
            </div>
            <p className="text-muted-foreground text-sm" dir={dir}>
              {resolveLevelSupportTitle(locale, titleEs, titleAr, title)}
            </p>
            <p className="text-muted-foreground mt-1 max-w-md text-sm" dir={dir}>
              {locale === "es" ? descriptionEs : locale === "ar" ? descriptionAr : description}
            </p>
          </div>
        </div>
        <span className="text-muted-foreground shrink-0 text-sm font-medium tabular-nums" dir="ltr">
          {completedCount} / {lessons.length}
        </span>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={staggerChildren}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {lessons.map((lesson, index) => (
          <HomeLessonCard
            key={lesson.id}
            lesson={lesson}
            number={index + 1}
            completed={isCompleted(lesson.id)}
            isCurrent={lesson.id === currentLessonId}
            isPremiumUser={isPremiumUser}
          />
        ))}
      </motion.div>
    </section>
  );
}
