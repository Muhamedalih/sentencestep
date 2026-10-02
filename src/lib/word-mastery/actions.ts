"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { recordQuestEventsAndBadges } from "@/lib/features/quest-service";
import { isMistakeWorthTracking, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import {
  markMistakeCorrected,
  recordMistake,
  recordMistakeReview,
} from "@/lib/supabase/queries/mistakes";
import { recordWordReview } from "@/lib/supabase/queries/word-mastery";
import { getLearnerToday, getSmartWordsAccess } from "@/lib/word-mastery/access";
import { planOutcome } from "@/lib/word-mastery/plan";
import { isWordOutcomeInput } from "@/lib/word-mastery/types";
import type { WordOutcomeResult } from "@/lib/word-mastery/types";

/** Runs one optional write; a failure is logged and never stops the others (or the learner). */
async function attempt<T>(label: string, run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    console.error(`[word-mastery] ${label} failed`, error);
    return null;
  }
}

/**
 * Records how one Word Lists word went — the single server call the "Smart
 * word practice" screens make per word (clean and assisted answers, the first
 * miss, and the final correct answer after a miss), in place of the old trio
 * of completion / mistake / "master" actions.
 *
 * Two ledgers are moved together so nothing that reads either one drifts:
 *
 *  1. The word's spaced schedule (word_mastery): strength 0-5, due 1/3/7/16/30
 *     days out, a miss sends it back. See record_word_review.
 *  2. The weak-word ledger (mistakes), which "Review All Words", Fix Your
 *     Mistakes, Home and the daily session still read. A miss puts the word in
 *     it; typing it right afterwards CORRECTS it (re-checked tomorrow) instead
 *     of wiping it, so a word missed a minute ago stays on the weak list until
 *     it has passed its reviews. A clean answer advances a due review (or
 *     corrects an active mistake); both calls are no-ops on a word that is in
 *     neither state, so they are safe to make blindly.
 *
 * Quiet by design: for a guest, with the feature off for this visitor, or
 * before the migration is applied it simply does nothing (returns null) — a
 * learner is never blocked or shown an error for an optional feature. A Server
 * Action is reachable as a direct POST, so the input is re-validated and the
 * feature gate re-checked here; the account is the one read from the session.
 */
export async function recordWordOutcomeAction(input: unknown): Promise<WordOutcomeResult | null> {
  if (!isWordOutcomeInput(input)) return null;
  const access = await getSmartWordsAccess();
  if (!access.spaced || !access.userId) return null;
  const userId = access.userId;
  const word = normalizeMistakeWord(input.word);
  if (word.length === 0) return null;

  const today = await getLearnerToday();

  // What this outcome writes is decided in one pure place (see planOutcome), so
  // the decision table is tested without a database.
  const plan = planOutcome(input.outcome, isMistakeWorthTracking(word));

  // 1. The schedule. "recovered" adds nothing to it: the miss was recorded the
  // moment it happened, and the word is already back at strength 0, due tomorrow.
  const scheduleOutcome = plan.schedule;
  const review =
    scheduleOutcome === null
      ? null
      : await attempt("word review", () => recordWordReview(input.wordId, scheduleOutcome, today));

  // 2. The weak-word ledger. Every step is a guarded no-op when the word is not
  // in the state it expects, so they run in order without reading anything first.
  for (const step of plan.ledger) {
    switch (step) {
      case "recordMistake":
        await attempt("record mistake", () => recordMistake(word, null));
        break;
      case "markCorrected":
        await attempt("correct mistake", () => markMistakeCorrected(userId, word));
        break;
      case "reviewClean":
        await attempt("review mistake", () => recordMistakeReview(word, false));
        break;
    }
  }

  // A word that climbed a step counts toward the "Master N words" quest — and
  // only then: typing an already-known word again earns nothing, so the quest
  // cannot be finished by repeating easy words. After the response, like every
  // other quest credit, so the next word never waits on it.
  if (review?.advanced) {
    after(async () => {
      await recordQuestEventsAndBadges(userId, [{ type: "masterWords", amount: 1 }]);
    });
  }

  // The library and the review queue read all of this on the server.
  revalidatePath("/learn/word-lists");
  revalidatePath("/learn/word-lists/review");

  return review ? { strength: review.strength, dueOn: review.dueOn } : null;
}
