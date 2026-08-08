"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getLessonsByLevel, getLevels } from "@/lib/content";
import { useProgress } from "@/hooks/use-progress";
import { fadeInUp, staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LearningMode, LessonUnit } from "@/types/content";

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
  const { isCompleted, isLoaded } = useProgress();
  const levels = getLevels(units);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{description}</p>
      </div>

      <div className="flex flex-col gap-10">
        {levels.map((level) => (
          <section key={level}>
            <h2 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
              Level {level}
            </h2>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerChildren}
              className="grid gap-3 sm:grid-cols-2"
            >
              {getLessonsByLevel(units, level).map((unit) => {
                const completed = isLoaded && isCompleted(mode, unit.id);
                const locked = !unit.isFree;

                const card = (
                  <Card
                    className={cn(
                      "flex-row items-center justify-between gap-4 px-5 py-4 transition-shadow",
                      locked ? "opacity-60" : "hover:shadow-md",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium" dir="ltr">
                        {unit.title}
                      </p>
                      <p className="text-muted-foreground truncate text-sm" dir="rtl">
                        {unit.titleAr}
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
                  <motion.div key={unit.id} variants={fadeInUp}>
                    {locked ? (
                      <div aria-disabled="true" className="cursor-not-allowed">
                        {card}
                      </div>
                    ) : (
                      <Link href={`/learn/${mode}/${unit.id}`} className="block">
                        {card}
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        ))}
      </div>
    </div>
  );
}
