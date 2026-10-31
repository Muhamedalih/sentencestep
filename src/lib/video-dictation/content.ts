import { videoLessons } from "@/data/videos";

import type { VideoLesson } from "./types";

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

/** The part of the video the learner works through, in seconds. */
export function clipSeconds(lesson: VideoLesson): number {
  return Math.max(0, lesson.clipEndSeconds - lesson.clipStartSeconds);
}

/** "1:05": a length for the library, always minutes and seconds. */
export function formatClipLength(seconds: number): string {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

/** The thumbnail YouTube serves for a video (an image on i.ytimg.com, never stored by us). */
export function thumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`;
}

/** The page of the video on YouTube, where the channel gets its view. */
export function watchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
