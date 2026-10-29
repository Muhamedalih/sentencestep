import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DailyRuleRunner } from "@/components/today/daily-rule-runner";
import { LEVEL_LABEL, ladderForLevel } from "@/lib/daily-rule/levels";
import { loadPracticeVisit, loadRuleVisit } from "@/lib/daily-rule/load";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";

// What is due changes with every answer, and it is per learner.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * The rule of the day ("Rule of the day" permission). Three ways in:
 * - `from=<story id>`: the new rule comes from that story (its level picks the ladder), and an earlier
 *   rule that is due may be asked too. Alone, on to the words step; with `daily=1` (the day's last row on
 *   Home, after the words) back to Home.
 * - `daily=1`: the optional row on Home. Without `from=` the new rule comes from the learner's own finished
 *   texts at their level, and an earlier rule that is due may be asked too. Then back to Home.
 * - `recall=1`: from the end of Today, after the last step, when a rule is due and nothing was asked today
 *   yet. Only the earlier-rule question(s), then on to the finish screen.
 * - `redo=1` (with `daily=1`): the repeat button of the day's row once it is answered: what was taught and
 *   asked today, again, from the same texts. Nothing is recorded; then back to Home.
 * - `practice=<rule id>`: from the rule library, a practice of one rule the learner has met: three sentences of
 *   their own finished texts that show it, typed one after the other. Nothing is recorded; then back to the
 *   library. With fewer than three such sentences it goes back to the rule's page, which says so.
 * Nothing to show (no ladder at this level, a story with no usable text, nothing due), or the permission
 * closed, or signed out: straight on to where the card would have gone, instead of an empty card.
 */
export default async function TodayRulePage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    recall?: string;
    daily?: string;
    redo?: string;
    practice?: string;
  }>;
}) {
  const [features, user, locale] = await Promise.all([
    getEffectiveFeatures(),
    getCurrentUser(),
    getLocale(),
  ]);
  if (!features.rollouts.dailyRule || !features.rollouts.todaySession || !user) redirect("/learn");

  const { from, recall, daily, redo, practice } = await searchParams;
  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();

  if (typeof practice === "string" && practice.length > 0) {
    const practiceVisit = await loadPracticeVisit({
      userId: user.id,
      todayISO,
      ruleId: practice,
    });
    const practiceLadder = practiceVisit ? ladderForLevel(practiceVisit.level) : null;
    if (!practiceVisit || !practiceLadder) {
      redirect(`/learn/rules/${encodeURIComponent(practice)}?practice=none`);
    }
    return (
      <DailyRuleRunner
        visit={practiceVisit}
        todayISO={todayISO}
        locale={locale}
        continueHref="/learn/rules"
        ladderSize={practiceLadder.length}
        levelLabel={LEVEL_LABEL[practiceVisit.level] ?? ""}
        practice
      />
    );
  }

  const progress = await fetchProgressCached(todayISO).catch(() => null);
  const level = progress?.startingLevel ?? 1;
  const dailyMode = daily === "1";
  const redoMode = redo === "1";
  const fromStory = recall !== "1" && typeof from === "string" && from.length > 0;
  const onward = dailyMode
    ? "/learn"
    : fromStory
      ? "/learn/today/go?step=words"
      : "/learn/today/end";

  let visit = await loadRuleVisit({
    userId: user.id,
    todayISO,
    storyId: fromStory ? from! : null,
    locale,
    level,
    daily: dailyMode && !fromStory,
    redo: redoMode,
  });
  // The day's row names the story finished today, whose sentences may not be askable (no stored
  // recording): then the day's rule comes from the learner's own finished texts, as the row does without one.
  if (!visit && dailyMode && fromStory) {
    visit = await loadRuleVisit({
      userId: user.id,
      todayISO,
      storyId: null,
      locale,
      level,
      daily: true,
      redo: redoMode,
    });
  }
  const ladder = visit ? ladderForLevel(visit.level) : null;
  if (!visit || !ladder) redirect(onward);

  return (
    <DailyRuleRunner
      visit={visit}
      todayISO={todayISO}
      locale={locale}
      continueHref={onward}
      ladderSize={ladder.length}
      levelLabel={LEVEL_LABEL[visit.level] ?? ""}
      daily={dailyMode}
      redo={redoMode}
      libraryHref="/learn/rules"
    />
  );
}
