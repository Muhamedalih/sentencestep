"use client";

import { ReportPaymentProblem } from "@/components/billing/report-payment-problem";
import { useLocale } from "@/components/providers/locale-provider";
import type { PaymentReportCategory } from "@/lib/billing/payment-report";

/**
 * The clear way to say "something went wrong" while paying with Binance Pay: a
 * plain box with what it is for and a real "Report a problem" button, instead of
 * the small grey link the card payment has. Filed through the same payment
 * report as every other payment problem (see report-payment-problem.tsx), but
 * under a Binance path, so the admins are alerted and Admin > Binance Pay lists
 * it beside the order, the transfers and the visits of that learner.
 */
export function BinanceReportPrompt({
  defaultCategory = null,
}: {
  defaultCategory?: PaymentReportCategory | null;
}) {
  const { t } = useLocale();

  return (
    <section className="border-border flex flex-col gap-3 rounded-xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0" dir="auto">
        <h2 className="text-sm font-semibold">{t.binancePay.reportHeading}</h2>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
          {t.binancePay.reportBody}
        </p>
      </div>
      <ReportPaymentProblem
        variant="button"
        context="binance"
        defaultCategory={defaultCategory}
        className="w-full shrink-0 sm:w-auto"
      />
    </section>
  );
}
