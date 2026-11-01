import type { VideoLesson } from "@/lib/video-dictation/types";
import { gibbonsHowls } from "./gibbons-howls";
import { theTigersAndTheStrawberryParable } from "./the-tigers-and-the-strawberry-parable";
import { howCoconutsFillThemselvesWithWater } from "./how-coconuts-fill-themselves-with-water";
import { armyAntsBuildBridges } from "./army-ants-build-bridges";
import { weAllHaveThatOneFriend } from "./we-all-have-that-one-friend";
import { empathAnimatic } from "./empath-animatic";
import { howHorsefliesBiteYou } from "./how-horseflies-bite-you";
import { babyBirdsGape } from "./baby-birds-gape";
import { rabbitCourtshipChase } from "./rabbit-courtship-chase";
import { slothsAreGreatSwimmers } from "./sloths-are-great-swimmers";
import { whatSheReallyMeans } from "./what-she-really-means";
import { joeysInThePouch } from "./joeys-in-the-pouch";
import { whyDobermansHaveCroppedEars } from "./why-dobermans-have-cropped-ears";
import { someoneElsesDream } from "./someone-elses-dream";
import { urnsForTrueLove } from "./urns-for-true-love";
import { usualSuspects } from "./usual-suspects";
import { missionToEarth } from "./mission-to-earth";
import { onTheBall } from "./on-the-ball";
import { startFromScratch } from "./start-from-scratch";
import { ducksInTheRain } from "./ducks-in-the-rain";
import { antingBirdsAndAnts } from "./anting-birds-and-ants";

/** The prepared videos, in the order the library lists them. */
export const videoLessons: readonly VideoLesson[] = [
  onTheBall,
  startFromScratch,
  missionToEarth,
  usualSuspects,
  urnsForTrueLove,
  ducksInTheRain,
  someoneElsesDream,
  whyDobermansHaveCroppedEars,
  joeysInThePouch,
  whatSheReallyMeans,
  antingBirdsAndAnts,
  slothsAreGreatSwimmers,
  rabbitCourtshipChase,
  babyBirdsGape,
  howHorsefliesBiteYou,
  empathAnimatic,
  weAllHaveThatOneFriend,
  armyAntsBuildBridges,
  howCoconutsFillThemselvesWithWater,
  theTigersAndTheStrawberryParable,
  gibbonsHowls,
];
