import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BankReviewSession } from "@/components/learning/bank-review-session";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchBankStates } from "@/lib/supabase/queries/learner-words";
import { coreSet } from "@/lib/word-bank/core-sets";
import { loadCoreSetRound } from "@/lib/word-bank/core-load";
import { getLearnerToday } from "@/lib/word-mastery/access";

// A round is built for the day it is asked on: never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Core words · My Words" };

/**
 * One set of the site's core words («كلمات الموقع الأساسية», the shelf on Word Lists), asked in the bank's
 * own review screen: eight words, each typed into its home sentence. Behind the "wordBank" permission
 * (Admins only until the owner opens it) and for a signed-in learner; the first set of each level is
 * free and the others need Premium (an admin sees them all), as with a Word Lists group. A number
 * outside the shelf is a 404.
 */
export default async function CoreSetPage({ params }: { params: Promise<{ n: string }> }) {
  const [features, user, { n }] = await Promise.all([
    getEffectiveFeatures(),
    getCurrentUser(),
    params,
  ]);
  if (!features.rollouts.wordBank || !user) redirect("/learn");

  const set = /^\d{1,3}$/.test(n) ? coreSet(Number(n)) : undefined;
  if (!set) notFound();
  if (!set.free) {
    const allowed = (await Promise.all([hasPremiumAccess(), isAdmin()])).some(Boolean);
    if (!allowed) redirect("/upgrade");
  }

  const todayISO = await getLearnerToday();
  const [words, bankTotal] = await Promise.all([
    loadCoreSetRound(set, todayISO),
    fetchBankStates(user.id).then(
      (states) => states.length,
      () => 0,
    ),
  ]);
  if (words.length === 0) redirect("/learn/word-lists");

  return (
    <BankReviewSession
      words={words}
      bankTotal={bankTotal}
      more={false}
      todayISO={todayISO}
      backTo="lists"
    />
  );
}
