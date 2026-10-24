import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
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
