import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { VideoSession } from "@/components/video-dictation/video-session";
import { isAdmin } from "@/lib/admin/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getVideoLessons, isTrialVideo, visibleVideoLessons } from "@/lib/video-dictation/content";

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
  // A trial video (a creator's text with no permission) is for an Admin only: for anyone else it is a 404.
  const admin = getVideoLessons().some(isTrialVideo) ? await isAdmin() : false;
  const lessons = visibleVideoLessons(admin);
  const lesson = lessons.find((candidate) => candidate.id === id);
  if (!lesson) notFound();

  const next = lessons[lessons.indexOf(lesson) + 1];
  return <VideoSession lesson={lesson} nextLessonId={next?.id ?? null} />;
}
