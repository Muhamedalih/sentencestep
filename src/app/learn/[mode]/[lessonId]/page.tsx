import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonSession } from "@/components/learning/lesson-session";
import { getLessonById, lessonsByMode } from "@/data/lessons";
import { LEARNING_MODES, isLearningMode, modeMeta } from "@/lib/learning-modes";

export function generateStaticParams() {
  return LEARNING_MODES.flatMap((mode) =>
    lessonsByMode[mode].filter((unit) => unit.isFree).map((unit) => ({ mode, lessonId: unit.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mode: string; lessonId: string }>;
}): Promise<Metadata> {
  const { mode, lessonId } = await params;
  if (!isLearningMode(mode)) return {};
  const unit = getLessonById(mode, lessonId);
  return { title: unit?.title ?? modeMeta[mode].title };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ mode: string; lessonId: string }>;
}) {
  const { mode, lessonId } = await params;
  if (!isLearningMode(mode)) notFound();

  const unit = getLessonById(mode, lessonId);
  if (!unit || !unit.isFree) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <LessonSession unit={unit} />
    </div>
  );
}
