import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonSession } from "@/components/learning/lesson-session";
import { findNextLesson, getLessons } from "@/lib/content";
import { LEARNING_MODES, isLearningMode, modeMeta } from "@/lib/learning-modes";

export async function generateStaticParams() {
  const params = await Promise.all(
    LEARNING_MODES.map(async (mode) => {
      const units = await getLessons(mode);
      return units.filter((unit) => unit.isFree).map((unit) => ({ mode, lessonId: unit.id }));
    }),
  );
  return params.flat();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mode: string; lessonId: string }>;
}): Promise<Metadata> {
  const { mode, lessonId } = await params;
  if (!isLearningMode(mode)) return {};
  const units = await getLessons(mode);
  const unit = units.find((item) => item.id === lessonId);
  return { title: unit?.title ?? modeMeta[mode].title };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ mode: string; lessonId: string }>;
}) {
  const { mode, lessonId } = await params;
  if (!isLearningMode(mode)) notFound();

  const units = await getLessons(mode);
  const unit = units.find((item) => item.id === lessonId);
  if (!unit || !unit.isFree) notFound();

  const nextLesson = findNextLesson(units, unit.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <LessonSession unit={unit} nextLesson={nextLesson} />
    </div>
  );
}
