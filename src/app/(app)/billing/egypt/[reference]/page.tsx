import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

import { EgyptWalletInstructions } from "@/components/billing/egypt-wallet-instructions";
import { PaymentStatusRefresh } from "@/components/billing/payment-status-refresh";
import { ReportPaymentProblem } from "@/components/billing/report-payment-problem";
import { PaymentConfirmedActions } from "@/components/billing/thirty-day-plan";
import { BackButton } from "@/components/layout/back-button";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AFTER_PAYMENT_COOKIE, safeLessonPath } from "@/lib/billing/after-payment";
import { EGYPT_WALLET_PROVIDER } from "@/lib/billing/egypt-wallet/constants";
import { createEgyptWalletStore } from "@/lib/billing/egypt-wallet/store";
import { egyptStrings } from "@/lib/billing/egypt-wallet/strings";
import { verifyAndFulfill } from "@/lib/billing/payments/fulfillment";
import type { FulfillmentOutcome } from "@/lib/billing/payments/fulfillment";
import { getEgyptWalletRuntime } from "@/lib/billing/payments/runtime";
import type { PaymentRuntime } from "@/lib/billing/payments/runtime";
import type { PaymentOrder } from "@/lib/billing/payments/types";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { formatLongDate } from "@/lib/i18n/format-date";
import { getLocale } from "@/lib/i18n/get-locale";
import { isFirstPayment } from "@/lib/progress/thirty-day-plan";
import { getCurrentUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Pay with Vodafone Cash",
};

// Rendered per request: what it shows is whatever the database says about this
// order right now, and it re-renders itself while the transfer is awaited.
export const dynamic = "force-dynamic";

const MAX_REFERENCE_LENGTH = 255;
/** While waiting for the transfer: look again every few seconds for about an hour, then every so often for a while after. */
const WAIT_REFRESH = { intervalMs: 5_000, maxRefreshes: 720 };
const LATE_REFRESH = { intervalMs: 15_000, maxRefreshes: 120 };

/**
 * Where a learner who chose "Pay with Vodafone Cash" lands: their own wallet number, then the amount
 * in whole pounds and the shop's wallet, each with a copy button, and then the page simply waits.
 * Nothing in the URL is trusted: the order is looked up scoped to the signed-in learner, and Premium
 * is only ever granted by verifyAndFulfill (the same path as every other payment) once a transfer
 * message from the learner's number has been linked to this order. Visiting this page can grant
 * nothing by itself.
 */
export default async function EgyptWalletPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const [user, locale, { reference }] = await Promise.all([getCurrentUser(), getLocale(), params]);
  if (!user) redirect("/login?next=/upgrade");
  if (reference.length > MAX_REFERENCE_LENGTH) redirect("/upgrade");

  const t = locale ? getDictionary(locale) : fallbackDictionary;
  const s = egyptStrings(locale);

  let runtime: PaymentRuntime | null = null;
  try {
    runtime = getEgyptWalletRuntime();
  } catch (error) {
    console.error("[egypt-wallet] payment page: payment storage is not configured", error);
  }

  let order: PaymentOrder | null = null;
  let outcome: FulfillmentOutcome = { outcome: "unknown_reference" };
  if (runtime) {
    try {
      order = await runtime.store.getOrderForUser(reference, user.id);
      if (order && order.provider !== EGYPT_WALLET_PROVIDER) order = null;
      if (order) outcome = await verifyAndFulfill(runtime, order.reference_id, "return_page");
    } catch (error) {
      // A database hiccup: the learner may well have paid, so keep waiting rather than show an error.
      console.error("[egypt-wallet] payment page verification failed", error);
      if (order) outcome = { outcome: "pending" };
    }
  }

  let walletNumber = "";
  let payerPhone: string | null = null;
  if (order) {
    try {
      const store = createEgyptWalletStore();
      const [settings, intent] = await Promise.all([
        store.getSettings(),
        store.getIntent(order.id),
      ]);
      walletNumber = settings.walletNumber;
      payerPhone = intent?.payerPhone ?? null;
    } catch (error) {
      console.error("[egypt-wallet] payment page could not read the settings", error);
    }
  }

  const afterPaymentPath = safeLessonPath((await cookies()).get(AFTER_PAYMENT_COOKIE)?.value);
  // The back control is only offered while the transfer is awaited: the other screens have their own way on.
  const shell = (content: ReactNode, withBack = false) => (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16 sm:py-24">
      <Link href="/learn" className="self-center" aria-label={t.marketing.homeLinkAriaLabel}>
        <Logo />
      </Link>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2">
        {withBack && (
          <BackButton label={s.back} fallbackHref="/upgrade" className="-ms-2 self-start" />
        )}
        <Card className="w-full">{content}</Card>
      </div>
    </div>
  );

  if (!runtime || walletNumber === "") {
    return shell(
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{s.pageTitle}</CardTitle>
        <CardDescription>{s.notConfigured}</CardDescription>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/upgrade">{t.premium.backToLearning}</Link>
        </Button>
      </CardHeader>,
    );
  }
  if (!order || outcome.outcome === "unknown_reference") redirect("/upgrade");

  if (outcome.outcome === "fulfilled" || outcome.outcome === "already_fulfilled") {
    const premiumUntil = outcome.premiumUntil ?? order.premium_period_end ?? null;
    // "Your first 30 days" is for a first payment only; anything unreadable leaves the card out.
    let firstPayment = false;
    try {
      firstPayment = isFirstPayment(
        await runtime.store.listRecentOrdersForUser(user.id, 20),
        order.reference_id,
      );
    } catch (error) {
      console.error(
        "[egypt-wallet] payment page: could not tell whether this is a first payment",
        error,
      );
    }
    return shell(
      <>
        <CardHeader className="items-center text-center">
          <div className="bg-success/15 text-success flex size-12 items-center justify-center rounded-full">
            <CircleCheck className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl" role="status" aria-live="polite">
            {t.premium.paymentConfirmedHeading}
          </CardTitle>
          <CardDescription>
            {premiumUntil
              ? t.premium.paymentConfirmedBody.replace(
                  "{date}",
                  formatLongDate(premiumUntil, locale),
                )
              : t.premium.thanks}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5">
          <PaymentConfirmedActions
            copy={t.premium}
            common={t.common}
            afterPaymentPath={afterPaymentPath}
            showPlan={firstPayment}
          />
        </CardContent>
      </>,
    );
  }

  if (outcome.outcome === "needs_review") {
    return shell(
      <>
        <CardHeader className="items-center text-center">
          <div className="bg-brand-muted text-primary flex size-12 items-center justify-center rounded-full">
            <CircleAlert className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">{t.premium.paymentReviewHeading}</CardTitle>
          <CardDescription>{t.premium.paymentReviewBody}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ReportPaymentProblem defaultCategory="paid_not_active" variant="button" />
        </CardContent>
      </>,
    );
  }

  // Closed for a reason other than running out of time: cancelled or failed.
  if (outcome.outcome === "closed" && outcome.status !== "expired") {
    return shell(
      <>
        <CardHeader className="items-center text-center">
          <div className="bg-brand-muted text-primary flex size-12 items-center justify-center rounded-full">
            <CircleAlert className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">{t.premium.paymentNotCompletedHeading}</CardTitle>
          <CardDescription>{t.premium.paymentNotCompletedBody}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/upgrade">{t.common.tryAgain}</Link>
          </Button>
        </CardContent>
      </>,
    );
  }

  // Still waiting for the transfer: inside the order's hour, or past it (a late transfer from the saved number still counts).
  const expired =
    outcome.outcome === "closed" ||
    (order.link_expires_at !== null && Date.parse(order.link_expires_at) < Date.now());

  return shell(
    <>
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{s.pageTitle}</CardTitle>
        <p className="text-sm font-medium" dir="auto">
          {s.accessForDays.replace("{days}", String(order.premium_days))}
        </p>
        <CardDescription>{s.pageIntro}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <EgyptWalletInstructions
          reference={order.reference_id}
          walletNumber={walletNumber}
          amount={order.charge_amount}
          payerPhone={payerPhone}
          expiresAt={order.link_expires_at}
          expired={expired}
        />
        <div className="flex justify-center">
          <ReportPaymentProblem defaultCategory="paid_not_active" />
        </div>
        {expired && (
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/upgrade">{s.startNewOrder}</Link>
            </Button>
          </div>
        )}
        <PaymentStatusRefresh {...(expired ? LATE_REFRESH : WAIT_REFRESH)} />
      </CardContent>
    </>,
    true,
  );
}
