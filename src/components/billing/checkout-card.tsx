import type { ReactNode } from "react";
import { Check, Info, Lock, RefreshCcwDot, Sparkles, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

interface CheckoutCardProps {
  t: Dictionary;
  /** The USD price as shown to the visitor, e.g. "$2". */
  price: string;
  /** The same price spread over the period, e.g. "$0.07". */
  pricePerDay: string;
  days: number;
  /** The checkout button, or the sign-in link for a signed-out visitor. */
  action: ReactNode;
  /** A current Premium learner adding days: no benefit list, and the days stack. */
  extend?: boolean;
  /** Only the signed-in checkout button starts a payment, so the payment-page notes belong to it alone. */
  showPaymentNotes?: boolean;
}

/**
 * The /upgrade purchase card: the one place a price is shown (USD only), what
 * the purchase is and is not, and the neutral heads-up that the payment
 * partner's own page may show another currency, all before the button.
 */
export function CheckoutCard({
  t,
  price,
  pricePerDay,
  days,
  action,
  extend = false,
  showPaymentNotes = true,
}: CheckoutCardProps) {
  const daysLabel = String(days);

  return (
    <Card className="border-primary/25 gap-0 overflow-hidden rounded-2xl py-0 shadow-lg">
      <div className="from-primary to-primary/75 text-primary-foreground relative overflow-hidden bg-gradient-to-br px-6 pt-6 pb-7">
        <div
          aria-hidden="true"
          className="bg-accent/30 pointer-events-none absolute -end-12 -top-16 size-48 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary-foreground/15 text-primary-foreground border-transparent backdrop-blur-sm">
              <Sparkles aria-hidden="true" />
              {extend ? t.premium.extendHeading : t.common.premium}
            </Badge>
            <Badge className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/25">
              {t.premium.oneTimeBadge}
            </Badge>
          </div>

          <div>
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                dir="ltr"
                className="text-5xl leading-none font-semibold tracking-tight tabular-nums"
              >
                {price}
              </span>
              <span className="text-primary-foreground/80 text-sm font-medium tracking-wide">
                USD
              </span>
            </p>
            <p className="text-primary-foreground/85 mt-2 text-sm" dir="auto">
              {t.premium.accessForDays.replace("{days}", daysLabel)}
              <span aria-hidden="true"> · </span>
              {t.premium.perDayCaption.replace("{amount}", pricePerDay)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">
        {extend ? (
          <p className="text-muted-foreground flex items-start gap-2.5 text-sm" dir="auto">
            <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{t.premium.extendStackNote.replace("{days}", daysLabel)}</span>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {t.premium.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm">
                <span className="bg-success/15 text-success mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-3.5" aria-hidden="true" strokeWidth={3} />
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        {!extend && (
          <div className="border-border border-t pt-5">
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              {t.premium.checkoutStepsHeading}
            </h2>
            <ol className="flex flex-col gap-3">
              {t.premium.checkoutSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm">
                  <span className="bg-brand-muted text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step.replace("{days}", daysLabel)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {showPaymentNotes && (
            <p
              className="bg-muted text-muted-foreground flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-xs leading-relaxed"
              dir="auto"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{t.premium.paymentPartnerNote}</span>
            </p>
          )}

          {action}

          <ul
            className={cn(
              "text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1 text-xs",
            )}
          >
            <li className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5" aria-hidden="true" />
              {t.premium.trustSecure}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <RefreshCcwDot className="size-3.5" aria-hidden="true" />
              {t.premium.trustNoRenewal}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="size-3.5" aria-hidden="true" />
              {t.premium.trustInstant}
            </li>
          </ul>

          {showPaymentNotes && (
            <p className="text-muted-foreground/80 text-center text-[11px] leading-relaxed">
              {t.premium.paymentDetailsCaption}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
