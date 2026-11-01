import { videoLessons } from "@/data/videos";
import { videoKinds } from "@/data/videos/kinds";

import { arrangeLessons } from "./arrange";
import type { VideoArrangement, VideoSection } from "./arrange";
import type { VideoLesson, VideoLevel } from "./types";

export { formatClipLength, thumbnailUrl } from "./format";

/** Every prepared video, in the order the library shows them. The videos are files in the code for now. */
export function getVideoLessons(): readonly VideoLesson[] {
  return videoLessons;
}

export function getVideoLesson(id: string): VideoLesson | undefined {
  return videoLessons.find((lesson) => lesson.id === id);
}

/** A trial video carries a creator's text with no permission (see VideoTextSource). */
export function isTrialVideo(lesson: VideoLesson): boolean {
  return lesson.textSource === "trial";
}

/** The videos a viewer may open: a trial video is only for an Admin. */
export function visibleVideoLessons(adminViewer: boolean): readonly VideoLesson[] {
  return adminViewer ? videoLessons : videoLessons.filter((lesson) => !isTrialVideo(lesson));
}

/** The sections of the library for these videos (see arrangeLessons), in the default order when `saved` is null. */
export function arrangeVideoLessons(
  lessons: readonly VideoLesson[],
  saved: VideoArrangement | null,
): VideoSection[] {
  return arrangeLessons(lessons, videoKinds, saved);
}

/** The part of the video the learner works through, in seconds. */
export function clipSeconds(lesson: VideoLesson): number {
  return Math.max(0, lesson.clipEndSeconds - lesson.clipStartSeconds);
}

/**
 * What a library card shows of a video: a few plain fields, so the library can hand it to the browser
 * without the sentences, their translations and every word meaning that a whole VideoLesson carries.
 */
export interface VideoCardData {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  level: VideoLevel;
  clipSeconds: number;
  sentenceCount: number;
}

export function videoCard(lesson: VideoLesson): VideoCardData {
  return {
    id: lesson.id,
    youtubeId: lesson.youtubeId,
    title: lesson.title,
    channel: lesson.channel,
    level: lesson.level,
    clipSeconds: clipSeconds(lesson),
    sentenceCount: lesson.sentences.length,
  };
}

/** The page of the video on YouTube, where the channel gets its view. */
export function watchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
