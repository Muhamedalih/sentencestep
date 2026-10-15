/**
 * Passages: short real-life scenes (funny, serious, inspiring) that a learner
 * listens to and reads part by part. A passage is a list of PARTS (sections);
 * each part is a handful of LINES (sentences, each optionally spoken by a
 * named character) followed by one quick comprehension question. At the end
 * the passage's own key words are handed over as a word lesson (a Word Lists
 * group, see Passage.wordGroupId).
 *
 * Deliberately its own shape — not Books or Stories. A learner never types
 * anything here: Stories and Daily Lessons are about producing the sentence,
 * Passages are about understanding it.
 */

/** The unstable_cache tag every share-cached passage read carries; saving the feature switches revalidates it so a publish shows at once. */
export const PASSAGES_CACHE_TAG = "passages";

export type PassageLevel = "A1" | "A2" | "B1" | "B2";

export const PASSAGE_LEVELS: readonly PassageLevel[] = ["A1", "A2", "B1", "B2"];

/** The mood of a passage — a label and a colour on its card, never a filter (there are too few passages for one to be useful yet). */
export type PassageTone = "funny" | "serious" | "inspiring";

export const PASSAGE_TONES: readonly PassageTone[] = ["funny", "serious", "inspiring"];

export interface PassageQuestionOption {
  en: string;
  ar: string;
}

/** One multiple-choice check at the end of a part. A true/false question is simply a question with two options. */
export interface PassageQuestion {
  id: string;
  prompt: string;
  promptAr: string;
  options: PassageQuestionOption[];
  /** Index into `options` of the right answer. */
  answer: number;
  /** 0-based position, inside the SAME part, of the line that holds the answer — lit up when a learner answers wrongly, so they learn to look back at the text instead of guessing. */
  evidence: number;
}

export interface PassageSentence {
  id: string;
  order: number;
  /** The character who says this line, e.g. "Sara"; null for the narrator. */
  speaker: string | null;
  en: string;
  ar: string;
  /** The narrated clip for this line (a public Storage URL), null until the passage's audio has been generated. */
  audioUrl: string | null;
}

export interface PassageSection {
  id: string;
  order: number;
  title: string;
  titleAr: string;
  sentences: PassageSentence[];
  questions: PassageQuestion[];
}

/** One word of the lesson a passage hands over at its end. */
export interface PassageWord {
  id: string;
  /** The word as the learner types it in Word Lists (lowercase). */
  word: string;
  /** Short Arabic explanation of the word's meaning. */
  hintAr: string;
  /** The passage line the word appears in (English), when it can be found — shown with the word highlighted. */
  contextEn: string | null;
  contextAr: string | null;
  /** A ready, public clip of the word itself — null when none exists yet (the card then falls back to the browser voice). */
  audioUrl: string | null;
}

export interface PassageSummary {
  id: string;
  order: number;
  level: PassageLevel;
  tone: PassageTone;
  /** A key into the icon set the cards draw from (see PASSAGE_ICONS) — never a free-form name. */
  icon: string;
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  isFree: boolean;
  sectionCount: number;
  sentenceCount: number;
  /** About how long it takes to listen to and answer — a rounded-up estimate, never exact. */
  estimatedMinutes: number;
  /** The Word Lists group made from this passage's words; null when there is none. */
  wordGroupId: string | null;
}

export interface Passage extends PassageSummary {
  sections: PassageSection[];
  words: PassageWord[];
  /** The linked word lesson's publication status — "published" means it is open in Word Lists for learners, anything else means only an admin can preview it. Null when there is no linked group. */
  wordGroupStatus: "draft" | "published" | "archived" | null;
}

/** What is saved for one learner and one passage (passage_progress). */
export interface PassageProgress {
  passageId: string;
  /** How many parts they have finished (answered and moved past). */
  sectionsDone: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string | null;
}
