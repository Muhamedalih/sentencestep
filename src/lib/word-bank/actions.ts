"use server";

import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  fetchBankHome,
  isMissingBankSchema,
  recordLearnerWordReview,
} from "@/lib/supabase/queries/learner-words";
import { homeSentenceTranslation } from "@/lib/word-bank/home-sentence";
import { BANK_LIMITS, parseBankWordInput } from "@/lib/word-bank/types";

/** The learner's "today" arrives from the page; anything further than this from the server's own clock is not a day they could be in. */
const MAX_DAY_SKEW_MS = 2 * 24 * 60 * 60 * 1000;

function isPlausibleDay(todayISO: string): boolean {
  return Math.abs(Date.parse(`${todayISO}T12:00:00Z`) - Date.now()) <= MAX_DAY_SKEW_MS;
}

/** Where the bank left a word after an answer: `ok` is false when nothing was recorded (the permission is closed, nobody is signed in, the table is missing, anything failed). */
export interface RecordedBankAnswer {
  ok: boolean;
  strength?: number;
  /** The word moved up a step with this answer. */
  advanced?: boolean;
}

/**
 * Records ONE word's first answer of a round in the learner's words bank («كلماتي»): the word enters
 * the bank (with where it was met, its meaning and its home sentence) and its schedule moves through
 * the atomic record_learner_word_review function. The second go after a miss is practice and is never
 * sent. Everything arrives as client input, so it is re-validated, and the "wordBank" permission must
 * be open for the caller (a Server Action is reachable as a direct POST). Best-effort: it never throws
 * into the practice screen, which carries on either way; on a project that has not applied the
 * migration it just answers `ok: false`. It answers where the word stands afterwards, which the
 * review round's finish screen adds up ("two became stable").
 */
export async function recordBankWordAction(input: unknown): Promise<RecordedBankAnswer> {
  try {
    const parsed = parseBankWordInput(input);
    if (!parsed || !isPlausibleDay(parsed.todayISO)) return { ok: false };
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.wordBank || !user) return { ok: false };
    const recorded = await recordLearnerWordReview(parsed);
    return recorded
      ? { ok: true, strength: recorded.strength, advanced: recorded.advanced }
      : { ok: false };
  } catch (error) {
    if (isMissingBankSchema(error)) {
      console.warn("[word-bank] the learner_words migration is not applied yet");
    } else {
      console.error("[word-bank] recordBankWordAction failed", error);
    }
    return { ok: false };
  }
}

/**
 * The translation of one word's home sentence, in the learner's own language, for the card the review
 * shows after a miss. Only the learner's own bank row says which sentence and where it came from (the
 * browser sends the word and nothing else), and the permission must be open. Null when there is none
 * to show, and on any failure: the card then shows the sentence alone.
 */
export async function fetchBankHomeSentenceAction(
  word: unknown,
): Promise<{ translation: string | null }> {
  const none = { translation: null };
  try {
    if (typeof word !== "string") return none;
    const target = normalizeMistakeWord(word);
    if (target.length < 2 || target.length > BANK_LIMITS.word) return none;
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.wordBank || !user) return none;
    const home = await fetchBankHome(user.id, target);
    if (!home) return none;
    return { translation: await homeSentenceTranslation(home, await getLocale()) };
  } catch (error) {
    console.error("[word-bank] fetchBankHomeSentenceAction failed", error);
    return none;
  }
}
