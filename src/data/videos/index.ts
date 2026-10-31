import type { VideoLesson } from "@/lib/video-dictation/types";
import { urnsForTrueLove } from "./urns-for-true-love";
import { usualSuspects } from "./usual-suspects";
import { missionToEarth } from "./mission-to-earth";
import { onTheBall } from "./on-the-ball";
import { startFromScratch } from "./start-from-scratch";

/** The prepared videos, in the order the library lists them. */
export const videoLessons: readonly VideoLesson[] = [
  onTheBall,
  startFromScratch,
  missionToEarth,
  usualSuspects,
  urnsForTrueLove,
];
