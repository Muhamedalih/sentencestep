import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { FinishPaymentBanner } from "@/components/app/finish-payment-banner";
import { PremiumExpiryBanner } from "@/components/app/premium-expiry-banner";
import { TodayHome } from "@/components/today/today-home";
import { isAdmin } from "@/lib/admin/access";
import { getAccessState } from "@/lib/billing/access";
import { REMINDER_WINDOW_DAYS } from "@/lib/billing/expiry-reminders";
import { getOpenCheckout } from "@/lib/billing/open-checkout";
import { TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { loadToday } from "@/lib/today/load";
import type { TodayData } from "@/lib/today/load";
import { fetchWeakWordsAction } from "@/lib/weak-words/actions";

/**
 * Home for a signed-in learner who has finished at least one lesson, while "Today's session (new
 * Home)" is open for them: one batch of reads, then the Today card. Everything the old Home also
 * loaded — the engagement cards, the Passages card, the book recommendation, the plan words, the
 * whole lesson catalog — is left out on purpose, so this page asks the database for less than the
 * Home it replaces.
 */
export async function TodayHomePage({
  userId,
  locale,
}: {
  userId: string;
  locale: SupportLocale | null;
}) {
  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const weakWordCount = fetchWeakWordsAction()
    .then((words) => words.length)
    .catch(() => 0);

  let view: {
    data: TodayData;
    isPremium: boolean;
    expiryEndsAt: string | null;
    openCheckout: Awaited<ReturnType<typeof getOpenCheckout>>;
  } | null = null;
  try {
    const [features, access, admin, progress, openCheckout] = await Promise.all([
      getEffectiveFeatures(),
      getAccessState(),
      isAdmin(),
      fetchProgressCached(todayLocalISODate()),
      getOpenCheckout(userId),
    ]);
    const isPremium = access.isPremium || admin;
    const data = await loadToday({
      userId,
      locale,
      timeZone,
      progress,
      isPremium,
      passagesEnabled: features.passages.enabled,
      weakWordCount,
    });
    // Only a real, dated paid period can end — the sitewide free-access promotion and the dev
    // override have no end date, so they never get the banner (same rule as the classic Home).
    const expiryEndsAt =
      access.isPremium &&
      access.expiresAt &&
      new Date(access.expiresAt).getTime() > Date.now() &&
      new Date(access.expiresAt).getTime() - Date.now() <= REMINDER_WINDOW_DAYS * 86_400_000
        ? access.expiresAt
        : null;
    view = { data, isPremium, expiryEndsAt, openCheckout };
  } catch (error) {
    console.error("[today] Home failed, showing the classic Home", error);
  }
  // Whatever goes wrong here, the learner still gets a working Home.
  if (!view) redirect("/learn?classic=1");
  const { data, isPremium, expiryEndsAt, openCheckout } = view;

  return (
    <TodayHome
      data={data}
      banners={
        <>
          {expiryEndsAt && <PremiumExpiryBanner endsAt={expiryEndsAt} className="mb-4" />}
          {openCheckout && !isPremium && (
            <FinishPaymentBanner
              reference={openCheckout.reference}
              url={openCheckout.url}
              className="mb-4"
            />
          )}
        </>
      }
    />
  );
}
