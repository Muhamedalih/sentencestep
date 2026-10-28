import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DailyRuleRunner } from "@/components/today/daily-rule-runner";
import { loadRuleVisit } from "@/lib/daily-rule/load";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";

// What is due changes with every answer, and it is per learner.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * The rule of the day ("Rule of the day" permission). Two ways in:
 * - `from=<story id>`: from the end of Today's story. The new rule comes from that story, and an earlier
 *   rule that is due may be asked too. Then on to the words step.
 * - `recall=1`: from the start of Today, when a rule is due and nothing was asked today yet. Only the
 *   earlier-rule question(s), then on to the next Today step.
 * Nothing to show (a story that is not A1, no text with a recording, nothing due), or the permission
 * closed, or signed out: straight on to the next step instead of an empty card.
 */
export default async function TodayRulePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; recall?: string }>;
}) {
  const [features, user, locale] = await Promise.all([getEffectiveFeatures(), getCurrentUser(), getLocale()]);
  if (!features.rollouts.dailyRule || !features.rollouts.todaySession || !user) redirect("/learn");

  const { from, recall } = await searchParams;
  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const fromStory = recall !== "1" && typeof from === "string" && from.length > 0;
  const onward = fromStory ? "/learn/today/go?step=words" : "/learn/today/go?step=listen&rule=skip";

  const visit = await loadRuleVisit({
    userId: user.id,
    todayISO,
    storyId: fromStory ? from! : null,
    locale,
  });
  if (!visit) redirect(onward);

  return <DailyRuleRunner visit={visit} todayISO={todayISO} locale={locale} continueHref={onward} />;
}
