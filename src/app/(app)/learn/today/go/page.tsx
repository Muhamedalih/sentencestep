import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
import { loadTodayNext, loadTodayStoryDone } from "@/lib/today/load";
import { STEP_KINDS } from "@/lib/today/plan";

export const dynamic = "force-dynamic";

/**
 * "Carry on" in Today's session: sends the learner to the step they asked for — or, when nothing is
 * open for it, the next one that has something — and to the finish screen after the last. The
 * passage's end screen and the story's use this instead of knowing what comes next themselves.
 * With `redo=1` ("Redo today's lessons") the story is the one finished today, not the next one.
 */
export default async function TodayGoPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; redo?: string }>;
}) {
  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.rollouts.todaySession || !user) redirect("/learn");

  const { step, redo } = await searchParams;
  // After the words: the day's exam when the learner has one waiting, else the finish screen. The
  // exam row is dealt here when it is not there yet: this route is often reached without Home being
  // rebuilt since the story was finished, and the story's sentences are part of the exam.
  if (step === "sentences") {
    const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
    const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
    let waiting = false;
    if (features.rollouts.sentenceBank) {
      const progress = await fetchProgressCached(todayISO).catch(() => null);
      waiting = await sentenceReviewPending(user.id, todayISO, {
        context: {
          userId: user.id,
          todayISO,
          timeZone,
          completions: progress?.completions ?? [],
        },
        features,
      });
    }
    redirect(waiting ? `${SENTENCE_REVIEW_HREF}?flow=1` : "/learn/today/end");
  }
  const wanted = STEP_KINDS.find((kind) => kind === step) ?? "listen";
  const [premium, admin, locale] = await Promise.all([hasPremiumAccess(), isAdmin(), getLocale()]);
  const next = await loadTodayNext({
    userId: user.id,
    locale,
    isPremium: premium || admin,
    passagesEnabled: features.passages.enabled,
  });
  const redoing = redo === "1";
  const storyId = redoing
    ? ((await loadTodayStoryDone({
        timeZone: (await cookies()).get(TIMEZONE_COOKIE)?.value,
      })) ?? next.storyId)
    : next.storyId;
  const targets = {
    listen: next.passageId ? `/learn/passages/${next.passageId}?today=1` : null,
    story: storyId ? `/learn/stories/${storyId}?today=1${redoing ? "&redo=1" : ""}` : null,
    words: next.wordsAvailable ? "/learn/today/words" : null,
  };
  for (const kind of STEP_KINDS.slice(STEP_KINDS.indexOf(wanted))) {
    const href = targets[kind];
    if (href) redirect(href);
  }
  redirect("/learn/today/end");
}
