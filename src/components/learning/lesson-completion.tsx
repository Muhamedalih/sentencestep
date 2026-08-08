"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { popIn } from "@/lib/motion";
import type { LearningMode, LessonUnit, VocabularyItem } from "@/types/content";

export function LessonCompletion({
  mode,
  accuracy,
  nextLesson,
  vocabulary,
}: {
  mode: LearningMode;
  /** 0–1 ratio of correct to total keystrokes across the lesson. */
  accuracy: number;
  nextLesson?: LessonUnit;
  vocabulary?: VocabularyItem[];
}) {
  const reducedMotion = useReducedMotion();
  const accuracyPercent = Math.round(accuracy * 100);

  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      className="border-border bg-card flex flex-col items-center gap-4 rounded-2xl border p-12 text-center"
    >
      <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
        <PartyPopper className="size-7" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Lesson complete</h2>
        <p className="text-muted-foreground mt-1">
          {accuracyPercent >= 95
            ? `Excellent — ${accuracyPercent}% accuracy.`
            : `Great work — ${accuracyPercent}% accuracy.`}
        </p>
      </div>

      {vocabulary && vocabulary.length > 0 && (
        <div className="w-full max-w-sm">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            Words from this lesson
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {vocabulary.map((item) => (
              <span
                key={item.id}
                className="bg-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
              >
                <span className="font-medium" dir="ltr">
                  {item.en}
                </span>
                <span className="text-muted-foreground" dir="rtl">
                  {item.ar}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" asChild>
          <Link href={`/learn/${mode}`}>Back to lessons</Link>
        </Button>
        {nextLesson && (
          <Button asChild>
            <Link href={`/learn/${mode}/${nextLesson.id}`}>
              Next lesson
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
