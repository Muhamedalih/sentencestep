import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { VideoSession } from "@/components/video-dictation/video-session";
import { isAdmin } from "@/lib/admin/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { flattenSections } from "@/lib/video-dictation/arrange";
import { getVideoArrangement } from "@/lib/video-dictation/arrangement-store";
import { withSavedTimings } from "@/lib/video-dictation/timings-store";
import { arrangeVideoLessons, visibleVideoLessons } from "@/lib/video-dictation/content";

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
  // The same check decides who gets the editor of the stops.
  const admin = await isAdmin();
  const lessons = visibleVideoLessons(admin);
  const lesson = lessons.find((candidate) => candidate.id === id);
  if (!lesson) notFound();

  // "Next video" follows the order the library shows, section after section (and an Admin's arrangement).
  const order = flattenSections(arrangeVideoLessons(lessons, await getVideoArrangement()));
  const next = order[order.indexOf(lesson.id) + 1];
  // The times an Admin saved by hand replace the ones written in the video's file (one cached read, shared).
  const timed = await withSavedTimings(lesson);
  return <VideoSession lesson={timed} nextLessonId={next ?? null} canEditStops={admin} />;
}
