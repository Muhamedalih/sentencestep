import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { RuleLibraryDetail, type RulePreview } from "@/components/today/rule-library-detail";
import { isAdmin } from "@/lib/admin/access";
import { neighbourRules, ruleById } from "@/lib/daily-rule/levels";
import { preparedItemsForCard } from "@/lib/daily-rule/prepared";
import { teachFor } from "@/lib/daily-rule/teach";
import { LEARN_ITEMS, NOTICE_SENTENCES } from "@/lib/daily-rule/visit";
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
 * library, and an id that is on no ladder is a 404. An admin can open every rule of the course (a preview:
 * a rule not met yet shows the examples it is taught with, and every page has arrows to the rules around it).
 * `?practice=none` is where a practice that found no three sentences in the learner's texts sends them
 * back, with a line that says so.
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
  const rule = ruleById(ruleId);
  if (!rule) notFound();
  // The admin check is the one the permissions already made for this request (it is read once per request).
  const [states, admin] = await Promise.all([
    fetchLearnerRuleStates(user.id).catch(() => []),
    isAdmin().catch(() => false),
  ]);
  const met = states.some((row) => row.ruleId === ruleId);
  if (!met && !admin) redirect("/learn/rules");

  const { previous, next } = neighbourRules(ruleId);
  const preview: RulePreview | undefined = admin
    ? {
        unmet: !met,
        ...(previous
          ? { previous: { href: `/learn/rules/${previous.id}`, title: previous.title } }
          : {}),
        ...(next ? { next: { href: `/learn/rules/${next.id}`, title: next.title } } : {}),
      }
    : undefined;

  const { practice } = await searchParams;
  return (
    <RuleLibraryDetail
      ruleId={ruleId}
      teach={teachFor(ruleId)}
      locale={locale}
      backHref="/learn/rules"
      practiceHref={`/learn/today/rule?practice=${encodeURIComponent(ruleId)}`}
      practiceCount={LEARN_ITEMS}
      noSentences={practice === "none"}
      notice={met ? [] : preparedItemsForCard(rule).slice(0, NOTICE_SENTENCES)}
      noticeFrom="examples"
      preview={preview}
    />
  );
}
