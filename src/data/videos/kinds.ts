import type { VideoKind } from "@/lib/video-dictation/types";

/**
 * The section each prepared video is listed under by default, by its id (an Admin can move any video
 * to another section from the library page, and that choice is stored in the database, not here). The
 * video files themselves are generated, so the type lives in this one place instead of inside them. A
 * video with no entry lands in "other" until it gets one. An entry for a video that is not in this
 * branch yet is harmless (lessons are published one at a time, so release can lack a video master has).
 */
export const videoKinds: Readonly<Record<string, VideoKind>> = {
  "if-street-interviews-were-not-staged": "comedy",
  "what-she-really-means": "comedy",
  "urns-for-true-love": "comedy",
  "empath-animatic": "comedy",
  "we-all-have-that-one-friend": "comedy",

  "on-the-ball": "english",
  "start-from-scratch": "english",

  "mission-to-earth": "science",
  "sea-level-rise": "science",
  "usual-suspects": "science",
  "how-coconuts-fill-themselves-with-water": "science",

  "ducks-in-the-rain": "animals",
  "joeys-in-the-pouch": "animals",
  "anting-birds-and-ants": "animals",
  "sloths-are-great-swimmers": "animals",
  "rabbit-courtship-chase": "animals",
  "baby-birds-gape": "animals",
  "why-dobermans-have-cropped-ears": "animals",
  "how-horseflies-bite-you": "animals",
  "army-ants-build-bridges": "animals",

  "someone-elses-dream": "motivation",
};
