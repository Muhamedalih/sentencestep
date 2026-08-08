import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonListView } from "@/components/app/lesson-list-view";
import { getLessons } from "@/lib/content";
import { LEARNING_MODES, isLearningMode, modeMeta } from "@/lib/learning-modes";

export function generateStaticParams() {
  return LEARNING_MODES.map((mode) => ({ mode }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mode: string }>;
}): Promise<Metadata> {
  const { mode } = await params;
  if (!isLearningMode(mode)) return {};
  return { title: modeMeta[mode].title };
}

export default async function ModeLessonsPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!isLearningMode(mode)) notFound();

  const copy = modeMeta[mode];
  const units = await getLessons(mode);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <LessonListView mode={mode} title={copy.title} description={copy.description} units={units} />
    </div>
  );
}
