"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { getLessonsByLevel, getUnits } from "@/lib/content-helpers";
import { levelCodeOf } from "@/lib/levels";
import type { LessonUnit } from "@/types/content";

/**
 * The phone Home's line to the Path (permission mobilePath): the level the learner is in, how many of
 * its lessons are done, and a bar. It opens the Path. Below md: only.
 */
export function CoursePathStrip({
  units,
  isPremiumUser,
}: {
  units: LessonUnit[];
  isPremiumUser: boolean;
}) {
  const { t } = useLocale();
  const progress = useSharedProgress();
  const { completedIds, currentLesson } = useCurrentLesson(units, isPremiumUser, progress);
  if (!currentLesson) return null;

  const lessons = getLessonsByLevel(units, currentLesson.level);
  const done = lessons.filter((lesson) => completedIds.includes(lesson.id)).length;
  const percent = lessons.length === 0 ? 0 : Math.round((done / lessons.length) * 100);
  const course = getUnits("normal").find((unit) => unit.level === currentLesson.level);
  const code = course ? levelCodeOf(course.title) : null;

  return (
    <Link
      href="/learn/path"
      className="border-border bg-card hover:bg-muted/50 flex items-center gap-3 rounded-2xl border p-4 transition-colors md:hidden"
    >
      <span className="min-w-0 flex-1">
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <span dir="auto">{t.mobilePath.navPath}</span>
          {code && (
            <span dir="ltr" className="text-foreground font-semibold">
              {code}
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm font-semibold" dir="auto">
          {t.mobilePath.doneOfTotal
            .replace("{done}", String(done))
            .replace("{total}", String(lessons.length))}
        </span>
        <span className="bg-muted mt-2 block h-1.5 overflow-hidden rounded-full">
          <span className="bg-primary block h-full rounded-full" style={{ width: `${percent}%` }} />
        </span>
      </span>
      <ChevronRight className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
    </Link>
  );
}
