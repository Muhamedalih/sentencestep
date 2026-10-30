import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { VideoSession } from "@/components/video-dictation/video-session";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getVideoLesson, getVideoLessons } from "@/lib/video-dictation/content";

export const metadata: Metadata = { title: "Video" };

/**
 * One video of Video dictation, full screen (no header or sidebar, like the lesson player): the
 * "videoDictation" permission decides who can open it (Admins only for now), and an id that is not a
 * prepared video is a 404.
 */
export default async function VideoPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const features = await getEffectiveFeatures();
  if (!features.rollouts.videoDictation) redirect("/learn");

  const { id } = await params;
  const lesson = getVideoLesson(id);
  if (!lesson) notFound();

  const lessons = getVideoLessons();
  const next = lessons[lessons.findIndex((candidate) => candidate.id === id) + 1];
  return <VideoSession lesson={lesson} nextLessonId={next?.id ?? null} />;
}
