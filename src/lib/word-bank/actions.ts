"use server";

import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isMissingBankSchema, recordLearnerWordReview } from "@/lib/supabase/queries/learner-words";
import { parseBankWordInput } from "@/lib/word-bank/types";

/** The learner's "today" arrives from the page; anything further than this from the server's own clock is not a day they could be in. */
const MAX_DAY_SKEW_MS = 2 * 24 * 60 * 60 * 1000;

function isPlausibleDay(todayISO: string): boolean {
  return Math.abs(Date.parse(`${todayISO}T12:00:00Z`) - Date.now()) <= MAX_DAY_SKEW_MS;
}

/**
 * Records ONE word's first answer of a round in the learner's words bank («كلماتي»): the word enters
 * the bank (with where it was met, its meaning and its home sentence) and its schedule moves through
 * the atomic record_learner_word_review function. The second go after a miss is practice and is never
 * sent. Everything arrives as client input, so it is re-validated, and the "wordBank" permission must
 * be open for the caller (a Server Action is reachable as a direct POST). Best-effort: it never throws
 * into the practice screen, which carries on either way; on a project that has not applied the
 * migration it just answers `ok: false`.
 */
export async function recordBankWordAction(input: unknown): Promise<{ ok: boolean }> {
  try {
    const parsed = parseBankWordInput(input);
    if (!parsed || !isPlausibleDay(parsed.todayISO)) return { ok: false };
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.wordBank || !user) return { ok: false };
    const recorded = await recordLearnerWordReview(parsed);
    return { ok: recorded !== null };
  } catch (error) {
    if (isMissingBankSchema(error)) {
      console.warn("[word-bank] the learner_words migration is not applied yet");
    } else {
      console.error("[word-bank] recordBankWordAction failed", error);
    }
    return { ok: false };
  }
}
