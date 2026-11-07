/**
 * Video dictation: a short video played from YouTube itself (the official player), stopped by the
 * page at the end of every sentence while the learner types it the way Stories are typed. Everything
 * here is plain data (no React, no Supabase), shared by the player, the practice screen, the admin
 * timing tool and the tests.
 */

/** One word of a sentence with its meaning, the same shape as Sentence.wordTranslations (Stories). */
export interface VideoWord {
  /** The word without the punctuation around it. */
  en: string;
  /** Its meaning in Arabic, as it is used in this sentence. */
  ar: string;
}

export interface VideoSentence {
  /** Stable inside the video, e.g. "on-the-ball-s3". */
  id: string;
  /** Where the sentence starts and ends, in seconds from the start of the WHOLE YouTube video. */
  startSeconds: number;
  endSeconds: number;
  /** The English text the learner types (punctuation is shown but never has to be typed). */
  en: string;
  /** The whole sentence in Arabic. */
  ar: string;
  /** One entry per whitespace-separated word of `en`, in the same order (see splitWords). */
  wordTranslations: VideoWord[];
}

export type VideoLevel = "A1" | "A2" | "B1" | "B2";

/**
 * What a video is about or how it feels: the sections of the library. The order here is the order the
 * sections are listed in until an Admin arranges them (comedy first, the owner's choice, then the facts,
 * the short stories and clear English, as the approved shelves mock-up of 2026-11-07 lists them); "other"
 * is where a video with no entry in src/data/videos/kinds.ts lands. "animals" holds no video today (the
 * owner moved every talking-animal cartoon to comedy on 2026-11-07) and stays for a future animal video
 * that is not a comedy; an empty section is not shown.
 */
export const VIDEO_KINDS = [
  "comedy",
  "science",
  "motivation",
  "english",
  "animals",
  "other",
] as const;
export type VideoKind = (typeof VIDEO_KINDS)[number];

/**
 * Where the TEXT of a video comes from: what lets the site show it. "trial" means a creator's text
 * with no written permission; the owner decided on 2026-11-02 to show every video to every viewer anyway
 * (played only by YouTube's own player, free, with the creator and the video link shown), so the
 * value only records the rights status and hides nothing.
 */
export type VideoTextSource = "public-domain" | "creative-commons" | "permission" | "own" | "trial";

export interface VideoLesson {
  /** The slug used in the address: /learn/video/<id>. */
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  channelUrl: string;
  level: VideoLevel;
  /** The length of the whole YouTube video: a player reporting another length is playing an ad. */
  durationSeconds: number;
  /** The part of the video that is used: the first sentence starts after clipStart, the last one ends by clipEnd. */
  clipStartSeconds: number;
  clipEndSeconds: number;
  textSource: VideoTextSource;
  /** One line: where the text comes from and why the site may show it. */
  sourceNote: string;
  sentences: VideoSentence[];
}
