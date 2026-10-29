import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { RuleLibraryDetail } from "@/components/today/rule-library-detail";
import { ruleById } from "@/lib/daily-rule/levels";
import { LEARN_ITEMS } from "@/lib/daily-rule/visit";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchLearnerRuleStates } from "@/lib/supabase/queries/learner-rules";

// Which rules the learner has met changes with every answer, and the page is per learner.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My rules" };

/**
 * One rule of the rule library, opened (the dailyRule permission): the same two pages that taught it, then
 * the way on to a practice. Only a rule the learner has met has a page; any other id goes back to the
 * library, and an id that is on no ladder is a 404. `?practice=none` is where a practice that found no
 * three sentences in the learner's texts sends them back, with a line that says so.
 */
export default async function RuleLibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ ruleId: string }>;
  searchParams: Promise<{ practice?: string }>;
}) {
  const [features, user, locale] = await Promise.all([
    getEffectiveFeatures(),
    getCurrentUser(),
    getLocale(),
  ]);
  if (!features.rollouts.dailyRule || !features.rollouts.todaySession || !user) redirect("/learn");

  const { ruleId } = await params;
  if (!ruleById(ruleId)) notFound();
  const states = await fetchLearnerRuleStates(user.id).catch(() => []);
  if (!states.some((row) => row.ruleId === ruleId)) redirect("/learn/rules");

  const { practice } = await searchParams;
  return (
    <RuleLibraryDetail
      ruleId={ruleId}
      locale={locale}
      backHref="/learn/rules"
      practiceHref={`/learn/today/rule?practice=${encodeURIComponent(ruleId)}`}
      practiceCount={LEARN_ITEMS}
      noSentences={practice === "none"}
    />
  );
}
