import type { VideoLesson } from "@/lib/video-dictation/types";
import { ifStreetInterviewsWereNotStaged } from "./if-street-interviews-were-not-staged";
import { joeysInThePouch } from "./joeys-in-the-pouch";
import { whyDobermansHaveCroppedEars } from "./why-dobermans-have-cropped-ears";
import { someoneElsesDream } from "./someone-elses-dream";
import { ducksInTheRain } from "./ducks-in-the-rain";
import { seaLevelRise } from "./sea-level-rise";
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
  seaLevelRise,
  ducksInTheRain,
  someoneElsesDream,
  whyDobermansHaveCroppedEars,
  joeysInThePouch,
  ifStreetInterviewsWereNotStaged,
];
