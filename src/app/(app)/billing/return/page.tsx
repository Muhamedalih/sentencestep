import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleAlert, CircleCheck, Clock, SearchX } from "lucide-react";
import type { ReactNode } from "react";

import { PaymentStatusRefresh } from "@/components/billing/payment-status-refresh";
import { ReportPaymentProblem } from "@/components/billing/report-payment-problem";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AFTER_PAYMENT_COOKIE, safeLessonPath } from "@/lib/billing/after-payment";
import { verifyAndFulfill } from "@/lib/billing/payments/fulfillment";
import type { FulfillmentOutcome } from "@/lib/billing/payments/fulfillment";
import { getPaymentRuntime } from "@/lib/billing/payments/runtime";
import type { PaymentRuntime } from "@/lib/billing/payments/runtime";
import type { PaymentReportCategory } from "@/lib/billing/payment-report";
import type { PaymentOrder } from "@/lib/billing/payments/types";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { formatLongDate } from "@/lib/i18n/format-date";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Payment",
};

// Rendered per request: the outcome is whatever the payment provider reports
// right now, and the page re-renders itself while a payment is confirming.
export const dynamic = "force-dynamic";

const MAX_REFERENCE_LENGTH = 255;

async function loadOrder(
  runtime: PaymentRuntime,
  userId: string,
  referenceId: string | undefined,
): Promise<PaymentOrder | null> {
  if (referenceId) {
    return runtime.store.getOrderForUser(referenceId, userId);
  }
  // The provider normally appends our reference to the return URL; if it did
  // not, the learner's most recent order is the one they just paid for.
  return runtime.store.getLatestOrderForUser(userId, runtime.provider.name);
}

/**
 * Where the payment provider sends the learner back after checkout. Nothing
 * in the URL is trusted: the order is looked up scoped to the signed-in
 * learner, and whether premium is granted is decided by asking the provider's
 * own API (the same verifyAndFulfill the webhook and the reconcile job use),
 * so this page, the webhook and the job can all run in any order or at once.
 */
export default async function BillingReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ referenceId?: string | string[] }>;
}) {
  const [user, locale, params] = await Promise.all([getCurrentUser(), getLocale(), searchParams]);
  if (!user) redirect("/login?next=/upgrade");

  const t = locale ? getDictionary(locale) : fallbackDictionary;
  const rawReference = Array.isArray(params.referenceId)
    ? params.referenceId[0]
    : params.referenceId;
  const referenceId =
    rawReference && rawReference.length <= MAX_REFERENCE_LENGTH ? rawReference : undefined;

  let runtime: PaymentRuntime | null = null;
  try {
    runtime = getPaymentRuntime();
  } catch (error) {
    console.error("[payments] return page: payment storage is not configured", error);
  }

  let outcome: FulfillmentOutcome = { outcome: "unknown_reference" };
  let order: PaymentOrder | null = null;
  if (runtime) {
    try {
      order = await loadOrder(runtime, user.id, referenceId);
      if (order) outcome = await verifyAndFulfill(runtime, order.reference_id, "return_page");
    } catch (error) {
      // Provider or database hiccup: the learner may well have paid, so show
      // "confirming" rather than an error. The reconcile job settles it.
      console.error("[payments] return page verification failed", error);
      if (order) outcome = { outcome: "pending" };
    }
  }

  let content: {
    icon: ReactNode;
    heading: string;
    body: string;
    live?: boolean;
    retry?: boolean;
    /** What most likely went wrong in this state, so reporting it is one tap. */
    reportAs: PaymentReportCategory | null;
  };

  switch (outcome.outcome) {
    case "fulfilled":
    case "already_fulfilled": {
      const premiumUntil = outcome.premiumUntil ?? order?.premium_period_end ?? null;
      content = {
        icon: <CircleCheck className="size-6" aria-hidden="true" />,
        heading: t.premium.paymentConfirmedHeading,
        body: premiumUntil
          ? t.premium.paymentConfirmedBody.replace("{date}", formatLongDate(premiumUntil, locale))
          : t.premium.thanks,
        reportAs: null,
      };
      break;
    }
    case "pending":
      content = {
        icon: <Clock className="size-6" aria-hidden="true" />,
        heading: t.premium.paymentPendingHeading,
        body: t.premium.paymentPendingBody,
        live: true,
        reportAs: "paid_not_active",
      };
      break;
    case "closed":
      content = {
        icon: <CircleAlert className="size-6" aria-hidden="true" />,
        heading: t.premium.paymentNotCompletedHeading,
        body: t.premium.paymentNotCompletedBody,
        retry: true,
        reportAs: "payment_failed",
      };
      break;
    case "needs_review":
      content = {
        icon: <CircleAlert className="size-6" aria-hidden="true" />,
        heading: t.premium.paymentReviewHeading,
        body: t.premium.paymentReviewBody,
        reportAs: "paid_not_active",
      };
      break;
    default:
      content = {
        icon: <SearchX className="size-6" aria-hidden="true" />,
        heading: t.premium.paymentNotFound,
        body: "",
        retry: true,
        reportAs: null,
      };
  }

  const confirmed = outcome.outcome === "fulfilled" || outcome.outcome === "already_fulfilled";
  // The lesson the learner was stopped at when they opened the upgrade page, if
  // any (see startCheckout); the button goes there instead of to the dashboard.
  const afterPaymentPath = safeLessonPath((await cookies()).get(AFTER_PAYMENT_COOKIE)?.value);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16 sm:py-24">
      <Link href="/learn" className="self-center" aria-label={t.marketing.homeLinkAriaLabel}>
        <Logo />
      </Link>

      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="items-center text-center">
          <div
            className={
              confirmed
                ? "bg-success/15 text-success flex size-12 items-center justify-center rounded-full"
                : "bg-brand-muted text-primary flex size-12 items-center justify-center rounded-full"
            }
          >
            {content.icon}
          </div>
          <CardTitle className="text-xl" role="status" aria-live="polite">
            {content.heading}
          </CardTitle>
          {content.body && <CardDescription>{content.body}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-3">
          {confirmed && (
            <Button asChild size="lg">
              <Link href={afterPaymentPath ?? "/learn"}>
                {afterPaymentPath ? t.premium.continueLesson : t.common.startLearning}
              </Link>
            </Button>
          )}
          {content.retry && (
            <Button asChild>
              <Link href="/upgrade">{t.common.tryAgain}</Link>
            </Button>
          )}
          {!confirmed && !content.retry && (
            <Button asChild variant="outline">
              <Link href="/learn">{t.premium.backToLearning}</Link>
            </Button>
          )}
          {content.live && <PaymentStatusRefresh />}
          {!confirmed && (
            <div className="flex w-full justify-center pt-1">
              <ReportPaymentProblem
                defaultCategory={content.reportAs}
                variant={content.live ? "link" : "button"}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
