"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types/content";

/**
 * The homepage's lesson card — large image, title/titleAr, short
 * description, and status, per the Phase 2 redesign's visual reference.
 * Deliberately its own component rather than a reuse of lesson-list-view's
 * LessonCard: that one is a compact row (no image) built for a long
 * per-mode list; this one is an image-led tile built for a 4-up grid.
 */
export function HomeLessonCard({
  lesson,
  number,
  completed,
  isCurrent,
  isPremiumUser,
}: {
  lesson: Lesson;
  number: number;
  completed: boolean;
  isCurrent: boolean;
  isPremiumUser: boolean;
}) {
  const locked = !lesson.isFree && !isPremiumUser;
  const { t, dir } = useLocale();
  const supportTitle = lesson.supportTitle ?? lesson.title;

  return (
    <motion.div variants={fadeInUp} className="group h-full">
      <Link
        href={`/learn/normal/${lesson.id}`}
        aria-label={
          locked ? t.premium.lockedContentAriaLabel.replace("{title}", lesson.title) : lesson.title
        }
        className="focus-visible:ring-ring focus-visible:ring-offset-background block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <Card
          className={cn(
            "border-border/80 h-full gap-0 overflow-hidden border py-0 shadow-sm transition-all duration-300",
            locked ? "opacity-90" : "hover:shadow-lg motion-safe:group-hover:-translate-y-0.5",
            isCurrent && "ring-primary ring-2 ring-offset-2",
          )}
        >
          {/* Fixed 4:3 aspect ratio at every breakpoint — overrides
              LessonIllustration's own lg:aspect-auto/lg:h-full (meant for
              the split lesson-session layout, not a grid tile), which
              otherwise let the image stretch to whatever row height the
              grid happened to produce, distorting it. */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <LessonIllustration
              mode="normal"
              lessonId={lesson.id}
              title={lesson.title}
              illustrationUrl={lesson.illustrationUrl}
              className="aspect-[4/3] w-full transition-transform duration-500 ease-out motion-safe:group-hover:scale-105 lg:aspect-[4/3] lg:h-auto lg:w-full"
            />
            {isCurrent && (
              <Badge className="absolute top-3 left-3">{t.progress.continueMode}</Badge>
            )}
            {locked && (
              <span
                className="bg-background/90 text-foreground absolute top-3 right-3 flex size-8 items-center justify-center rounded-full shadow-sm"
                aria-hidden="true"
              >
                <Lock className="size-3.5" />
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-1.5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs font-medium tabular-nums">
                {t.lesson.lessonNumber.replace("{n}", String(number).padStart(2, "0"))}
              </span>
              {completed && (
                <Badge variant="success">
                  <Check aria-hidden="true" />
                  {t.common.done}
                </Badge>
              )}
              {locked && !completed && <Badge variant="muted">{t.wordLists.premiumGroup}</Badge>}
            </div>
            <h3 className="leading-snug font-semibold" dir="ltr">
              {lesson.title}
            </h3>
            <p className="text-muted-foreground text-sm" dir={dir}>
              {supportTitle}
            </p>
            {lesson.description && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm" dir="ltr">
                {lesson.description}
              </p>
            )}
            {lesson.supportDescription && (
              <p className="text-muted-foreground line-clamp-2 text-sm" dir={dir}>
                {lesson.supportDescription}
              </p>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
