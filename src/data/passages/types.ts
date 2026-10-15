import type { PassageLevel, PassageTone } from "@/lib/passages/types";

/**
 * The authoring shape for a passage — what scripts/insert-passages.ts turns
 * into rows (passages, passage_sections, passage_sentences, and a draft Word
 * Lists group with its words) and scripts/generate-passage-audio.ts turns
 * into narrated clips. Kept in the repository like src/data/lessons and
 * src/data/word-lists, so the content is reviewable in a diff and every
 * integrity rule (see src/lib/passages/validate.ts) runs as a normal test.
 */

/**
 * Which registered ElevenLabs voice speaks a character's lines. An alias, not
 * a voice id: the ids live in the `voices` table and are resolved by
 * scripts/generate-passage-audio.ts, so swapping a character's voice is a
 * one-word change here followed by a regeneration — never a content edit.
 * The narrator is implicit (every line without a `who`), and is the site's
 * default Stories/Books narration voice.
 */
export type PassageVoiceAlias =
  | "narrator"
  | "russ" // deep, smooth male
  | "calm-male" // calm, older-sounding male
  | "zara" // warm, real-world female
  | "ash" // kind, bright female
  | "autumn"; // warm, reflective female

export interface PassageLineSeed {
  /** The character speaking. Omitted for the narrator. Must be a key of the passage's `cast`. */
  who?: string;
  en: string;
  ar: string;
  /** What the narrator voice says when it should differ from `en` (e.g. a spelled-out number, or text that is displayed in capitals). Optional: by default the clip says `en` with emoji removed and capitals toned down (see spokenTextFor in src/lib/passages/spoken-text.ts). */
  say?: string;
}

export interface PassageQuestionSeed {
  en: string;
  ar: string;
  options: { en: string; ar: string }[];
  /** Index into `options`. */
  answer: number;
  /** 0-based position, within the same part, of the line that holds the answer. */
  evidence: number;
}

export interface PassageSectionSeed {
  title: string;
  titleAr: string;
  lines: PassageLineSeed[];
  question: PassageQuestionSeed;
}

export interface PassageWordSeed {
  /** The word as typed in Word Lists — lowercase, and it must appear (as a whole word) in the passage's own text. */
  word: string;
  /** A context sentence with exactly one "___" where the word goes — normally a line of the passage itself. */
  sentence: string;
  /** Short Arabic explanation of the word, ending with a full stop like every other Word Lists hint. */
  hintAr: string;
}

export interface PassageSeed {
  /** The passage id, and its URL: /learn/passages/<slug>. */
  slug: string;
  /** Position in the list, 1-based, unique within the level. */
  order: number;
  level: PassageLevel;
  tone: PassageTone;
  /** A key of PASSAGE_ICONS (src/components/passages/passage-icons.tsx). */
  icon: string;
  title: string;
  titleAr: string;
  /** One line shown on the card — the hook, never a spoiler. */
  summary: string;
  summaryAr: string;
  /** Character name -> the voice that speaks it. */
  cast: Record<string, PassageVoiceAlias>;
  sections: PassageSectionSeed[];
  /** 4-6 words taken from the passage; they become the passage's word lesson. */
  words: PassageWordSeed[];
}
