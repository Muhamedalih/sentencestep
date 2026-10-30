import type { Metadata } from "next";

import { VideoTimingTool } from "@/components/video-dictation/video-timing-tool";
import { getVideoLesson, getVideoLessons } from "@/lib/video-dictation/content";

export const metadata: Metadata = { title: "Video dictation · timing" };

/**
 * The admin tool that prepares a video for Video dictation (admins only, like every /admin/video
 * route: see ADMIN_ONLY_SEGMENTS in the middleware): paste a link and a transcript, press Space at the
 * end of each sentence, copy the JSON. `?lesson=<id>` opens a prepared video to adjust its timings.
 */
export default async function AdminVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { lesson: lessonId } = await searchParams;
  const lessons = getVideoLessons().map(({ id, title }) => ({ id, title }));
  const initial = lessonId ? (getVideoLesson(lessonId) ?? null) : null;
  return <VideoTimingTool key={lessonId ?? "new"} initial={initial} lessons={lessons} />;
}
