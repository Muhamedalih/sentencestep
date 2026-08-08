"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getLessonsByLevel, getUnits } from "@/lib/content";
import { useProgress } from "@/hooks/use-progress";
import { fadeInUp, staggerChildren } from "@/lib/motion";
import { findCurrentLesson } from "@/lib/progress/level";
import { cn } from "@/lib/utils";
import type { LearningMode, LessonUnit, Unit } from "@/types/content";

function LessonCard({
  mode,
  lesson,
  completed,
  isCurrent,
}: {
  mode: LearningMode;
  lesson: LessonUnit;
  completed: boolean;
  isCurrent: boolean;
}) {
  const locked = !lesson.isFree;

  const card = (
    <Card
      className={cn(
        "flex-row items-center justify-between gap-4 px-5 py-4 transition-shadow",
        locked ? "opacity-60" : "hover:shadow-md",
        isCurrent && "ring-primary ring-offset-background ring-2 ring-offset-2",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium" dir="ltr">
            {lesson.title}
          </p>
          {isCurrent && <Badge className="shrink-0">Continue</Badge>}
        </div>
        <p className="text-muted-foreground truncate text-sm" dir="rtl">
          {lesson.titleAr}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {completed && (
          <Badge variant="success">
            <Check aria-hidden="true" />
            Done
          </Badge>
        )}
        {locked && (
          <Badge variant="muted">
            <Lock aria-hidden="true" />
            Premium
          </Badge>
        )}
      </div>
    </Card>
  );

  return (
    <motion.div variants={fadeInUp}>
      {locked ? (
        <div aria-disabled="true" className="cursor-not-allowed">
          {card}
        </div>
      ) : (
        <Link href={`/learn/${mode}/${lesson.id}`} className="block">
          {card}
        </Link>
      )}
    </motion.div>
  );
}

function UnitSection({
  mode,
  unit,
  lessons,
  isCompleted,
  isLoaded,
  currentLessonId,
}: {
  mode: LearningMode;
  unit: Pick<Unit, "title" | "titleAr" | "description">;
  lessons: LessonUnit[];
  isCompleted: (mode: LearningMode, id: string) => boolean;
  isLoaded: boolean;
  currentLessonId: string | undefined;
}) {
  if (lessons.length === 0) return null;

  const completedCount = isLoaded
    ? lessons.filter((lesson) => isCompleted(mode, lesson.id)).length
    : 0;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold tracking-tight">{unit.title}</h2>
          <p className="text-muted-foreground text-sm">{unit.description}</p>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs font-medium">
          {completedCount} / {lessons.length}
        </span>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="grid gap-3 sm:grid-cols-2"
      >
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            mode={mode}
            lesson={lesson}
            completed={isLoaded && isCompleted(mode, lesson.id)}
            isCurrent={lesson.id === currentLessonId}
          />
        ))}
      </motion.div>
    </section>
  );
}

export function LessonListView({
  mode,
  title,
  description,
  units,
}: {
  mode: LearningMode;
  title: string;
  description: string;
  units: LessonUnit[];
}) {
  const { isCompleted, getCompletedIds, isLoaded } = useProgress();

  const courseUnits = getUnits(mode);
  const completedIds = isLoaded ? getCompletedIds(mode) : [];
  const currentLessonId = findCurrentLesson(units, completedIds)?.id;

  const coveredLevels = new Set(courseUnits.map((unit) => unit.level));
  const uncoveredLessons = units.filter((lesson) => !coveredLevels.has(lesson.level));

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{description}</p>
      </div>

      {units.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No lessons are available yet — check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {courseUnits.map((unit) => (
            <UnitSection
              key={unit.id}
              mode={mode}
              unit={unit}
              lessons={getLessonsByLevel(units, unit.level)}
              isCompleted={isCompleted}
              isLoaded={isLoaded}
              currentLessonId={currentLessonId}
            />
          ))}
          {uncoveredLessons.length > 0 && (
            <UnitSection
              mode={mode}
              unit={{ title: "More Lessons", titleAr: "", description: "Additional lessons." }}
              lessons={uncoveredLessons}
              isCompleted={isCompleted}
              isLoaded={isLoaded}
              currentLessonId={currentLessonId}
            />
          )}
        </div>
      )}
    </div>
  );
}
