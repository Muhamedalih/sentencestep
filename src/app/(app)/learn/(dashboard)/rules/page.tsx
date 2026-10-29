import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { RulesLibrary } from "@/components/today/rules-library";
import { buildLibrary } from "@/lib/daily-rule/library";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchLearnerRuleStates, isMissingRulesSchema } from "@/lib/supabase/queries/learner-rules";

// What is due changes with every answer, and the list is per learner.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My rules" };

/**
 * The rule library («قواعدي»), part of the rule of the day (the dailyRule permission, Admins only until
 * it is opened): every rule the learner has met, the ones due today first. Closed, or signed out: back to
 * Home. A missing learner_rules table (the migration not applied yet) reads as "no rules yet".
 */
export default async function RulesPage() {
  const [features, user, locale] = await Promise.all([
    getEffectiveFeatures(),
    getCurrentUser(),
    getLocale(),
  ]);
  if (!features.rollouts.dailyRule || !features.rollouts.todaySession || !user) redirect("/learn");

  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const [states, progress] = await Promise.all([
    fetchLearnerRuleStates(user.id).catch((error: unknown) => {
      if (!isMissingRulesSchema(error))
        console.error("[daily-rule] could not read the learner's rules", error);
      return [];
    }),
    fetchProgressCached(todayISO).catch(() => null),
  ]);

  return (
    <RulesLibrary
      library={buildLibrary({
        states,
        today: todayISO,
        level: progress?.startingLevel ?? 1,
        locale,
      })}
      locale={locale}
    />
  );
}
