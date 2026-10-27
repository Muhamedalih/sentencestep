import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BankReviewSession } from "@/components/learning/bank-review-session";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { loadBankRound } from "@/lib/word-bank/round-load";
import { getLearnerToday } from "@/lib/word-mastery/access";

// A round is built from the learner's own words and the day it is asked on: never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Review · My Words" };

/**
 * A review round of the learner's words bank («كلماتي»): up to five of their words that are due, each
 * asked in the form its strength calls for (see BankReviewSession). Behind the "wordBank" permission
 * (Admins only until the owner opens it), and for a signed-in learner only: anyone else, a learner
 * with nothing due and a project that cannot be read all go back to Home, where nothing about the
 * bank shows for them either. The section's own page does not exist yet, so the screen's way back
 * is Home for now.
 */
export default async function WordBankReviewPage() {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.wordBank || !user) redirect("/learn");

  const todayISO = await getLearnerToday();
  const round = await loadBankRound({ userId: user.id, todayISO }).catch((error: unknown) => {
    console.error("[word-bank] building the review round failed", error);
    return null;
  });
  if (!round || round.words.length === 0) redirect("/learn");

  return (
    <BankReviewSession
      words={round.words}
      bankTotal={round.bankTotal}
      more={round.more}
      todayISO={todayISO}
      backTo="home"
    />
  );
}
