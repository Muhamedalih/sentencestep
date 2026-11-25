import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { VideoSession } from "@/components/video-dictation/video-session";
import { isAdmin } from "@/lib/admin/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { flattenSections } from "@/lib/video-dictation/arrange";
import { getVideoArrangement } from "@/lib/video-dictation/arrangement-store";
import { withSavedTimings } from "@/lib/video-dictation/timings-store";
import { arrangeVideoLessons, getVideoLessons } from "@/lib/video-dictation/content";
import { localizeVideoLesson } from "@/lib/video-dictation/localize";
import { loadVideoWordClips } from "@/lib/video-dictation/word-clips";

export const metadata: Metadata = { title: "Video" };

/**
 * One video of Video dictation, full screen (no header or sidebar, like the lesson player): the
 * "videoDictation" permission decides who can open it (open to everyone), and an id that is not a
 * prepared video is a 404.
 */
export default async function VideoPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const features = await getEffectiveFeatures();
  if (!features.rollouts.videoDictation) redirect("/learn");

  const { id } = await params;
  // Every prepared video is open to every viewer; only an Admin gets the editor of the stops.
  const admin = await isAdmin();
  const lessons = getVideoLessons();
  const lesson = lessons.find((candidate) => candidate.id === id);
  if (!lesson) notFound();

  // A video an Admin deleted is a 404 for everyone else (an Admin can still open it, to look before restoring).
  const saved = await getVideoArrangement();
  if (!admin && saved?.removed?.includes(id)) notFound();

  // "Next video" follows the order the library shows, section after section (and an Admin's arrangement).
  const order = flattenSections(arrangeVideoLessons(lessons, saved));
  const at = order.indexOf(lesson.id);
  const next = at >= 0 ? order[at + 1] : undefined;
  // The times an Admin saved by hand replace the ones written in the video's file (one cached read, shared).
  // The meanings beside the English come in the learner's own language (Spanish and Turkish have their
  // own files; Arabic is how the lesson is written).
  const timed = localizeVideoLesson(await withSavedTimings(lesson), await getLocale());
  // The new finish screen ("videoFinish", Admins only until opened) names the next video.
  const nextTitle = next
    ? (lessons.find((candidate) => candidate.id === next)?.title ?? null)
    : null;
  // The finish screen's words play the Word Lists voice's (Emma) recorded clips: a cache-only read.
  const wordClips = features.rollouts.videoFinishLook ? await loadVideoWordClips(timed) : {};
  return (
    <VideoSession
      wordClips={wordClips}
      lesson={timed}
      nextLessonId={next ?? null}
      nextLessonTitle={nextTitle}
      newFinish={features.rollouts.videoFinish}
      finishLook={features.rollouts.videoFinishLook}
      canEditStops={admin}
      silenceWave={features.rollouts.videoSilence}
    />
  );
}
