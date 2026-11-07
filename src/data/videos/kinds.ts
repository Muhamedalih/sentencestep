import type { VideoKind } from "@/lib/video-dictation/types";

/**
 * The section each prepared video is listed under by default, by its id (an Admin can move any video
 * to another section from the library page, and that choice is stored in the database, not here). The
 * video files themselves are generated, so the type lives in this one place instead of inside them. A
 * video with no entry lands in "other" until it gets one. An entry for a video that is not in this
 * branch yet is harmless (lessons are published one at a time, so release can lack a video master has).
 *
 * The owner's cut of 2026-11-07: every talking-animal cartoon (Natural Habitat Shorts) is comedy;
 * "science" is the one-minute facts, "motivation" the short stories, "english" the calm, clear voices
 * (VOA and NASA). "animals" is kept for a future animal video that is not a comedy.
 */
export const videoKinds: Readonly<Record<string, VideoKind>> = {
  "if-street-interviews-were-not-staged": "comedy",
  "what-she-really-means": "comedy",
  "urns-for-true-love": "comedy",
  "nitwit-villager": "comedy",
  "empath-animatic": "comedy",
  "bees-know-when-youre-scared": "comedy",
  "we-all-have-that-one-friend": "comedy",
  "chicago-fishpocalypse": "comedy",
  "gibbons-howls": "comedy",
  "holiday-travels": "comedy",
  "ducks-in-the-rain": "comedy",
  "joeys-in-the-pouch": "comedy",
  "anting-birds-and-ants": "comedy",
  "pistol-shrimp": "comedy",
  "lyrebird-mimic": "comedy",
  "sloths-are-great-swimmers": "comedy",
  "rabbit-courtship-chase": "comedy",
  "baby-birds-gape": "comedy",
  "murre-chicks-leap": "comedy",
  "squirrel-brains-grow": "comedy",
  "rats-memory-map": "comedy",

  "how-coconuts-fill-themselves-with-water": "science",
  "he-grew-40-fruits-on-one-tree": "science",
  "microwaving-two-grapes-creates-plasma": "science",
  "why-dobermans-have-cropped-ears": "science",
  "how-this-1800s-movie-machine-worked": "science",
  "how-horseflies-bite-you": "science",
  "army-ants-build-bridges": "science",

  "someone-elses-dream": "motivation",
  "the-tigers-and-the-strawberry-parable": "motivation",
  "spear-vs-shield": "motivation",
  "the-medieval-meta-weapon": "motivation",

  "on-the-ball": "english",
  "start-from-scratch": "english",
  "mission-to-earth": "english",
  "sea-level-rise": "english",
  "usual-suspects": "english",
};

/**
 * The prepared videos that are WIDE (16:9), by id. Every other video is a vertical Short: its card on
 * the shelves is tall and shows the middle of YouTube's hqdefault picture, which for a Short is the
 * frame itself (the wide pictures YouTube makes for a Short put two blurred copies beside it). A new
 * wide video needs a line here, or its card crops it like a Short.
 */
export const wideVideoIds: ReadonlySet<string> = new Set([
  "on-the-ball",
  "start-from-scratch",
  "mission-to-earth",
  "sea-level-rise",
  "usual-suspects",
]);
