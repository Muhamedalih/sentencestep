import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TodayEnd } from "@/components/today/today-end";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { sentenceReviewPending } from "@/lib/sentence-bank/quest";
import { SENTENCE_REVIEW_HREF } from "@/lib/sentence-bank/review";
import { getCurrentUser } from "@/lib/supabase/auth";
import { loadTodayNext, loadTodayWeekDays } from "@/lib/today/load";
import { hasMoreTodayWords } from "@/lib/today/session-words-load";

// Per learner and per moment: what is waiting tomorrow is read live.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Today's session" };

/**
 * The finish screen of Today's session: how many of the words were remembered, what comes back
 * tomorrow, the reminder card when that is on, and five more words as the extra. Reached after the
 * words step — or straight from the carry-on route when nothing is left to do.
 */
export default async function TodayEndPage() {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.todaySession || !user) redirect("/learn");

  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const [premium, admin, locale, progress] = await Promise.all([
    hasPremiumAccess(),
    isAdmin(),
    getLocale(),
    fetchProgressCached(todayLocalISODate()),
  ]);
  const [next, weekDays, testWaiting, moreWords] = await Promise.all([
    loadTodayNext({
      userId: user.id,
      locale,
      isPremium: premium || admin,
      passagesEnabled: features.passages.enabled,
    }),
    loadTodayWeekDays({
      userId: user.id,
      locale,
      timeZone,
      completions: progress?.completions ?? [],
    }),
    // The day's test is dealt here when its row is not there yet: this screen is often reached
    // without Home being rebuilt since the story was finished, and the story's sentences are part
    // of the test.
    features.rollouts.sentenceBank
      ? sentenceReviewPending(user.id, todayISO, {
          context: {
            userId: user.id,
            todayISO,
            timeZone,
            completions: progress?.completions ?? [],
          },
          features,
        }).catch(() => false)
      : Promise.resolve(false),
    // "5 more words" is offered only while today's story and passage still have words the first round left.
    hasMoreTodayWords({
      userId: user.id,
      locale,
      timeZone,
      isPremium: premium || admin,
      passagesEnabled: features.passages.enabled,
    }).catch(() => false),
  ]);

  return (
    <TodayEnd
      weekDays={weekDays}
      nextTitle={next.nextTitle}
      moreWords={moreWords}
      testHref={testWaiting ? `${SENTENCE_REVIEW_HREF}?flow=1` : null}
    />
  );
}
