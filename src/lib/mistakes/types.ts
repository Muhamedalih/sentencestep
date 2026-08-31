import type { LearningMode } from "@/types/content";

/** One outstanding "Fix Your Mistakes" item, already hydrated with enough content context to render + pronounce it — see fetchMistakesAction. */
export interface MistakeQueueItem {
  /** Normalized identity (see normalizeMistakeWord) — what markMistakeCorrectedAction is keyed on. */
  word: string;
  /** The word's actual, correctly-cased text as it appears in sentenceEn — re-derived from the sentence at read time, never stored directly. */
  displayWord: string;
  sentenceId: string;
  sentenceEn: string;
  sentenceAr: string;
  /** Same locale-resolution rules as Sentence.supportText in src/types/content.ts — resolved server-side in fetchMistakesAction against the signed-in learner's active locale. Never falls back to sentenceAr for Spanish. */
  sentenceSupportText?: string;
  mode: LearningMode;
  lessonId: string;
  /** True for a due spaced review of an already-corrected word, false for an outstanding, never-yet-corrected mistake — see fetchMistakesAction. Drives FixYourMistakesSession's softer "let's see if you still remember this" framing and which action (markMistakeCorrectedAction vs markReviewCompletedAction) it calls on completion. */
  isReview: boolean;
  /**
   * Zero-based offset into `displayWord` of the letter the learner got
   * wrong the last time this word was mistyped (see mistakes.error_index) —
   * null when unknown (row predates this column) or when it no longer maps
   * onto the current displayWord (content changed since the mistake was
   * recorded, or the stored index is out of range). MistakeReviewSentence
   * shows this one letter in red only while it's still untyped; the moment
   * it's typed (or the word is completed) it reads exactly like every other
   * letter, the same as if this were never set.
   */
  errorIndex: number | null;
  /** This word's translation in the active support locale, resolved the same way sentenceSupportText is (see Sentence.supportWordTranslations) — undefined when no locale is active or no gloss exists for this word yet, in which case the preview shows the English word alone. */
  wordTranslation?: { en: string; text: string };
  /**
   * A cache-only pre-resolved pronunciation URL for THIS item, mirroring
   * LessonPage's own first-sentence pre-resolution (see lookupCachedAudioUrl) —
   * only ever populated for the queue's first item (see fetchMistakesAction),
   * since every later item's audio is instead prefetched client-side while
   * the item before it is on screen (see FixYourMistakesSession's own
   * prefetch effect). Never triggers Kokoro generation itself; a miss here
   * just leaves PronunciationButton to resolve on demand exactly as before.
   */
  audioUrl?: string | null;
}

/**
 * One word mistyped during THIS lesson attempt — built client-side in
 * LessonSession from the exact same per-sentence words TypingSentence
 * already reports via onSentenceMistakes (see that prop's doc comment),
 * purely so LessonCompletion can show what went wrong in the lesson the
 * learner just finished. Unlike MistakeQueueItem, this is never fetched from
 * the server, carries no persistent identity or review schedule, and is
 * never mode-gated — every learning mode that renders TypingSentence through
 * LessonSession (normal, stories, conversation) reports through this exact
 * same path. Shown alongside, not instead of, the account-wide "Fix Your
 * Mistakes" queue those same words are also recorded into.
 */
export interface SessionMistake {
  sentenceId: string;
  /** The sentence as typed against (English target text). */
  sentenceEn: string;
  /** Learner-facing translation/support text for the sentence — same fallback chain as Sentence.supportText (never sentence.ar directly). */
  sentenceSupportText: string;
  /** Raw (un-normalized) mistyped word tokens from this sentence, in first-mistyped order. */
  words: string[];
}
