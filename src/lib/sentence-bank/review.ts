import { outcomeFor } from "@/lib/word-mastery/schedule";
import type { WordOutcome } from "@/lib/word-mastery/schedule";

/**
 * Sentence bank: how one review of a typed sentence is asked and what it makes of the schedule.
 *
 * A sentence the learner typed in a lesson or a story comes back with its text HIDDEN (copying it
 * out again is not remembering it), on the very ladder Word Lists words ride — 1 / 3 / 7 / 16 / 30
 * days, a miss back to 0 — so nothing here is a second schedule: the outcome is the word schedule's
 * own (src/lib/word-mastery/schedule.ts, applyOutcome) and the `record_sentence_review` SQL function
 * mirrors it (see 20250347000000_sentence_mastery.sql). Pure and dependency-free of Supabase.
 */

/** How a sentence went in one review: clean, assisted (one help, no miss) or missed — the word schedule's three outcomes, so a sentence climbs the same ladder. */
export type SentenceOutcome = WordOutcome;

export interface SentenceAttempt {
  /** Every word came out right (compareDictation(...).exact) — a typo in any word is not exact. */
  exact: boolean;
  /** Helps taken: the first letters shown, a word revealed. One holds the sentence where it is; two count as not remembered. */
  helps: number;
  /** The learner pressed "I don't remember" (or looked at the answer): a miss whatever was typed afterwards. */
  gaveUp?: boolean;
}

/**
 * What one review does to the schedule: right with no help is clean; right with one help is
 * assisted (it holds its strength); a wrong answer, a second help or giving up is missed, back to
 * strength 0 and due tomorrow. The same three steps a word goes through (outcomeFor), so a learner
 * who knows the rules for words knows them for sentences.
 */
export function outcomeForSentence(attempt: SentenceAttempt): SentenceOutcome {
  return outcomeFor({
    missed: !attempt.exact || attempt.gaveUp === true,
    hints: Math.max(0, Math.trunc(attempt.helps)),
  });
}

/**
 * The three ways a sentence is asked, all with its text hidden:
 *  - partial   the learner hears it and sees it with one or two words missing, and types the missing words
 *  - audio     the learner only hears it and types the whole sentence
 *  - translate the learner sees its meaning in their own language and types the English
 */
export const REVIEW_FORMS = ["partial", "audio", "translate"] as const;
export type ReviewForm = (typeof REVIEW_FORMS)[number];

/** From this strength on a sentence is asked from the sound alone, without seeing any of it. */
export const AUDIO_FORM_FROM_STRENGTH = 2;
/** From this strength on it is asked from its meaning alone, the hardest way. */
export const TRANSLATE_FORM_FROM_STRENGTH = 4;

/**
 * A sentence of a lesson finished TODAY is asked as if it were this strong: heard and typed whole,
 * or, with no stored clip, from its meaning. The day's exam is a real test of what was just learned,
 * so it is never the easy fill-in-a-word form that a sentence never asked before would get.
 */
export const TODAY_FORM_STRENGTH = AUDIO_FORM_FROM_STRENGTH;

/** What a sentence can be asked with: a clip that is already stored, and its meaning in the learner's language. */
export interface FormAvailability {
  audio: boolean;
  prompt: boolean;
}

/**
 * The form a sentence is asked in, from how well it is remembered: the weak ones (0-1) get the most
 * help, the middle ones (2-3) only the sound, the strong ones (4-5) only the meaning. The two
 * sound-based forms need a clip that is already stored — a sentence with none is asked from its
 * meaning instead, never from a clip made just for the occasion (nothing is generated here). A
 * sentence with no meaning in the learner's language falls back the other way, to the sound alone,
 * and one with neither cannot be asked at all (null): the caller leaves it for another day.
 */
export function reviewFormFor(strength: number, available: FormAvailability): ReviewForm | null {
  const wanted: ReviewForm =
    strength >= TRANSLATE_FORM_FROM_STRENGTH
      ? "translate"
      : strength >= AUDIO_FORM_FROM_STRENGTH
        ? "audio"
        : "partial";
  if (wanted === "translate") {
    return available.prompt ? "translate" : available.audio ? "audio" : null;
  }
  if (available.audio) return wanted;
  return available.prompt ? "translate" : null;
}

/** Where the sentence review lives (inside Today's tasks). */
export const SENTENCE_REVIEW_HREF = "/learn/today/sentences";

/** About half a minute a sentence for an exam of three, typed whole as it often is, rounded up: what the task row says it takes. */
export const SENTENCE_REVIEW_MINUTES = 3;

/** Sentences read beyond the batch, so one that cannot be asked (no stored clip and no meaning in the learner's language) is replaced instead of shortening the batch. */
export const REVIEW_SPARES = 3;
