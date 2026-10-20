import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

import { BinancePayInstructions } from "@/components/billing/binance-pay-instructions";
import { BinanceReportPrompt } from "@/components/billing/binance-report-prompt";
import { PaymentStatusRefresh } from "@/components/billing/payment-status-refresh";
import { ReportPaymentProblem } from "@/components/billing/report-payment-problem";
import { BackButton } from "@/components/layout/back-button";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AFTER_PAYMENT_COOKIE, safeLessonPath } from "@/lib/billing/after-payment";
import { BINANCE_PAY_PROVIDER } from "@/lib/billing/binance/constants";
import type { BinancePaySettings } from "@/lib/billing/binance/settings";
import { createBinancePayStore } from "@/lib/billing/binance/store";
import { verifyAndFulfill } from "@/lib/billing/payments/fulfillment";
import type { FulfillmentOutcome } from "@/lib/billing/payments/fulfillment";
import { getBinancePayRuntime } from "@/lib/billing/payments/runtime";
import type { PaymentRuntime } from "@/lib/billing/payments/runtime";
import type { PaymentOrder } from "@/lib/billing/payments/types";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { formatLongDate } from "@/lib/i18n/format-date";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Pay with Binance Pay",
};

// Rendered per request: what it shows is whatever the database says about this
// order right now, and it re-renders itself while the transfer is awaited.
export const dynamic = "force-dynamic";

const MAX_REFERENCE_LENGTH = 255;
/** While waiting for the transfer: look again every few seconds for about an hour, then every so often for a while after. */
const WAIT_REFRESH = { intervalMs: 5_000, maxRefreshes: 720 };
const LATE_REFRESH = { intervalMs: 15_000, maxRefreshes: 120 };

/**
 * Where a learner who chose "Pay with Binance Pay" lands: the Binance ID to send
 * to, the amount and the order code, each with a copy button, and then the page
 * simply waits. Nothing in the URL is trusted: the order is looked up scoped to
 * the signed-in learner, and Premium is only ever granted by verifyAndFulfill
 * (the same path as every other payment) once the relay has linked a transfer
 * that carries this order's code. Visiting this page can grant nothing by itself.
 */
export default async function BinancePayPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const [user, locale, { reference }] = await Promise.all([getCurrentUser(), getLocale(), params]);
  if (!user) redirect("/login?next=/upgrade");
  if (reference.length > MAX_REFERENCE_LENGTH) redirect("/upgrade");

  const t = locale ? getDictionary(locale) : fallbackDictionary;

  let runtime: PaymentRuntime | null = null;
  try {
    runtime = getBinancePayRuntime();
  } catch (error) {
    console.error("[binance] payment page: payment storage is not configured", error);
  }

  let order: PaymentOrder | null = null;
  let outcome: FulfillmentOutcome = { outcome: "unknown_reference" };
  if (runtime) {
    try {
      order = await runtime.store.getOrderForUser(reference, user.id);
      if (order && order.provider !== BINANCE_PAY_PROVIDER) order = null;
      if (order) outcome = await verifyAndFulfill(runtime, order.reference_id, "return_page");
    } catch (error) {
      // A database hiccup: the learner may well have paid, so keep waiting rather than show an error.
      console.error("[binance] payment page verification failed", error);
      if (order) outcome = { outcome: "pending" };
    }
  }

  let settings: BinancePaySettings | null = null;
  let orderCode: string | null = null;
  if (order) {
    try {
      const store = createBinancePayStore();
      [settings, orderCode] = await Promise.all([
        store.getSettings(),
        store.getIntentCode(order.id),
      ]);
    } catch (error) {
      console.error("[binance] payment page could not read the settings", error);
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
          <BackButton
            label={t.binancePay.back}
            fallbackHref="/upgrade"
            className="-ms-2 self-start"
          />
        )}
        <Card className="w-full">{content}</Card>
      </div>
    </div>
  );

  if (!runtime || !settings || settings.binanceId === "") {
    return shell(
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{t.binancePay.pageTitle}</CardTitle>
        <CardDescription>{t.binancePay.notConfigured}</CardDescription>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/upgrade">{t.premium.backToLearning}</Link>
        </Button>
      </CardHeader>,
    );
  }
  if (!order || !orderCode || outcome.outcome === "unknown_reference") redirect("/upgrade");

  if (outcome.outcome === "fulfilled" || outcome.outcome === "already_fulfilled") {
    const premiumUntil = outcome.premiumUntil ?? order.premium_period_end ?? null;
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
        <CardContent className="flex justify-center">
          <Button asChild size="lg">
            <Link href={afterPaymentPath ?? "/learn"}>
              {afterPaymentPath ? t.premium.continueLesson : t.common.startLearning}
            </Link>
          </Button>
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
          <ReportPaymentProblem
            defaultCategory="paid_not_active"
            variant="button"
            context="binance"
          />
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

  // Still waiting for the transfer: inside the order's hour, or past it (a late transfer with the code still counts).
  const expired =
    outcome.outcome === "closed" ||
    (order.link_expires_at !== null && Date.parse(order.link_expires_at) < Date.now());

  return shell(
    <>
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">{t.binancePay.pageTitle}</CardTitle>
        <p className="text-sm font-medium" dir="auto">
          {t.premium.accessForDays.replace("{days}", String(order.premium_days))}
        </p>
        <CardDescription>{t.binancePay.pageIntro}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <BinancePayInstructions
          reference={order.reference_id}
          binanceId={settings.binanceId}
          displayName={settings.displayName}
          amount={order.charge_amount}
          orderCode={orderCode}
          expiresAt={order.link_expires_at}
          expired={expired}
        />
        <BinanceReportPrompt defaultCategory="paid_not_active" />
        {expired && (
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/upgrade">{t.binancePay.startNewOrder}</Link>
            </Button>
          </div>
        )}
        <PaymentStatusRefresh {...(expired ? LATE_REFRESH : WAIT_REFRESH)} />
      </CardContent>
    </>,
    true,
  );
}
