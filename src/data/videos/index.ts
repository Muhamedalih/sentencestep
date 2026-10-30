import type { VideoLesson } from "@/lib/video-dictation/types";
import { onTheBall } from "./on-the-ball";
import { startFromScratch } from "./start-from-scratch";

/** The prepared videos, in the order the library lists them. */
export const videoLessons: readonly VideoLesson[] = [onTheBall, startFromScratch];
