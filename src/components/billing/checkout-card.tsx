"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  Check,
  Gem,
  Gift,
  Info,
  Lock,
  RefreshCcwDot,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

import { ReportPaymentProblem } from "@/components/billing/report-payment-problem";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { startCheckout } from "@/lib/billing/checkout-actions";
import type { CheckoutActionState } from "@/lib/billing/checkout-actions";
import type { PlanView } from "@/lib/billing/plan-views";
import type { PlanId } from "@/lib/billing/plans";
import { formatDayCount } from "@/lib/i18n/format-days";
import { isSupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

const initialState: CheckoutActionState = {};

const PLAN_NAME_KEYS = { "1m": "plan1m", "3m": "plan3m", "6m": "plan6m" } as const;

interface CheckoutCardProps {
  /** Prepared on the server for the visitor's tier: every figure is already formatted, in USD. */
  plans: PlanView[];
  /** Signed-in visitors get the checkout form; everyone else a sign-in link. */
  signedIn: boolean;
  /** A current Premium learner adding days: no benefit list, and the days stack. */
  extend?: boolean;
  /** The running launch offer, with its last day already written out for the visitor's language. */
  offerNotice?: { bonusDays: number; endsOnLabel: string } | null;
  /** Real aggregate figures, already rounded and formatted, or null; a field is null when too small to quote. */
  socialProof?: { learners: string | null; lessons: string | null } | null;
}

/**
 * The /upgrade purchase card: the one place a price is shown (USD only), the
 * plan choice, what the purchase is and is not, and the neutral heads-up that
 * the payment partner's own page may show another currency, all before the
 * button. The form only ever submits a plan id; the server decides the price.
 */
export function CheckoutCard({
  plans,
  signedIn,
  extend = false,
  offerNotice = null,
  socialProof = null,
}: CheckoutCardProps) {
  const { t, locale } = useLocale();
  const [state, formAction, pending] = useActionState(startCheckout, initialState);
  const [selectedId, setSelectedId] = useState<PlanId>(
    () => (plans.find((plan) => plan.preselected) ?? plans[0])!.id,
  );
  const selected = plans.find((plan) => plan.id === selectedId) ?? plans[0]!;
  const daysLabel = String(selected.days);

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

          <div aria-live="polite">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                dir="ltr"
                className="text-5xl leading-none font-semibold tracking-tight tabular-nums"
              >
                {selected.price}
              </span>
              <span className="text-primary-foreground/80 text-sm font-medium tracking-wide">
                USD
              </span>
            </p>
            <p className="text-primary-foreground/85 mt-2 text-sm" dir="auto">
              {t.premium.accessForDays.replace("{days}", daysLabel)}
              <span aria-hidden="true"> · </span>
              {t.premium.perDayCaption.replace("{amount}", selected.perDay)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">
        <form action={formAction} className="flex flex-col gap-5">
          {offerNotice && (
            <p
              className="bg-accent/15 border-accent/40 text-foreground flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm font-medium"
              dir="auto"
            >
              <Gift className="text-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {t.premium.launchOfferBanner
                  .replace("{days}", formatDayCount(t.premium, locale, offerNotice.bonusDays))
                  .replace("{date}", offerNotice.endsOnLabel)}
              </span>
            </p>
          )}

          <fieldset className="flex flex-col gap-4">
            <legend className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              {t.premium.choosePlanHeading}
            </legend>
            {plans.map((plan) => {
              const checked = plan.id === selectedId;
              return (
                <label key={plan.id} className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={checked}
                    onChange={() => setSelectedId(plan.id)}
                    className="peer sr-only"
                  />
                  <div
                    className={cn(
                      "bg-card flex items-center gap-3.5 rounded-xl border-2 px-4 py-3.5 transition-all duration-200",
                      "peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
                      checked
                        ? "border-primary bg-primary/5 shadow-sm"
                        : plan.badge === "recommended"
                          ? "border-accent/60 hover:border-primary/50"
                          : "border-border hover:border-primary/40",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        checked ? "border-primary bg-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {checked && (
                        <Check className="text-primary-foreground size-3" strokeWidth={4} />
                      )}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-semibold">
                        {t.premium[PLAN_NAME_KEYS[plan.id]]}
                      </span>
                      <span className="text-muted-foreground text-xs" dir="auto">
                        {t.premium.perMonthCaption.replace("{amount}", plan.perMonth)}
                      </span>
                    </span>

                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span dir="ltr" className="text-lg leading-none font-semibold tabular-nums">
                        {plan.price}
                      </span>
                      {plan.savingsPercent !== null && (
                        <span
                          dir="auto"
                          className="bg-success/15 text-success rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                        >
                          {t.premium.saveBadge.replace("{percent}", String(plan.savingsPercent))}
                        </span>
                      )}
                      {plan.bonusDays > 0 && (
                        <span
                          dir="auto"
                          className="bg-accent/20 border-accent/40 text-foreground rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                        >
                          {t.premium.launchOfferChip.replace(
                            "{days}",
                            formatDayCount(t.premium, locale, plan.bonusDays),
                          )}
                        </span>
                      )}
                    </span>
                  </div>

                  {plan.badge === "recommended" && (
                    <span className="bg-accent text-accent-foreground ring-background absolute start-4 -top-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm ring-2">
                      <Star className="size-3 fill-current" aria-hidden="true" />
                      {t.premium.recommendedBadge}
                    </span>
                  )}
                  {plan.badge === "best-value" && (
                    <span className="bg-success text-success-foreground ring-background absolute start-4 -top-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm ring-2">
                      <Gem className="size-3" aria-hidden="true" />
                      {t.premium.bestValueBadge}
                    </span>
                  )}
                </label>
              );
            })}
          </fieldset>

          {extend && (
            <p className="text-muted-foreground flex items-start gap-2.5 text-sm" dir="auto">
              <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{t.premium.extendStackNote.replace("{days}", daysLabel)}</span>
            </p>
          )}

          {signedIn && (
            <p
              className="bg-muted text-muted-foreground flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-xs leading-relaxed"
              dir="auto"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{t.premium.paymentPartnerNote}</span>
            </p>
          )}

          <div className="flex flex-col gap-2">
            {signedIn ? (
              <Button type="submit" size="lg" disabled={pending} className="w-full">
                {!pending && <Lock aria-hidden="true" />}
                {pending
                  ? t.premium.redirecting
                  : t.premium.payCta
                      .replace("{price}", selected.price)
                      .replace("{days}", daysLabel)}
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href="/login?next=/upgrade">{t.premium.signInToUpgrade}</Link>
              </Button>
            )}
            {state?.error && (
              <p role="alert" className="text-muted-foreground text-center text-xs">
                {state.error}
              </p>
            )}
            {signedIn && (
              <p className="text-muted-foreground text-center text-xs leading-relaxed" dir="auto">
                {t.premium.termsNoticePrefix}
                <Link
                  href={locale && isSupportLocale(locale) ? `/${locale}/terms` : "/terms"}
                  prefetch={false}
                  className="text-foreground underline underline-offset-2"
                >
                  {t.premium.termsNoticeLink}
                </Link>
                {t.premium.termsNoticeSuffix}
              </p>
            )}
          </div>

          {!extend && socialProof && (socialProof.learners || socialProof.lessons) && (
            <ul className="text-foreground/80 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-medium">
              {socialProof.learners && (
                <li className="inline-flex items-center gap-1.5">
                  <Users className="text-primary size-3.5" aria-hidden="true" />
                  {t.premium.socialProofLearners.replace("{count}", socialProof.learners)}
                </li>
              )}
              {socialProof.lessons && (
                <li className="inline-flex items-center gap-1.5">
                  <BookOpenCheck className="text-primary size-3.5" aria-hidden="true" />
                  {t.premium.socialProofLessons.replace("{count}", socialProof.lessons)}
                </li>
              )}
            </ul>
          )}

          <ul className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
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

          {signedIn && (
            <p className="text-muted-foreground/80 text-center text-[11px] leading-relaxed">
              {t.premium.paymentDetailsCaption}
            </p>
          )}
        </form>

        {signedIn && (
          <div className="-mt-3 flex justify-center">
            <ReportPaymentProblem />
          </div>
        )}

        {!extend && (
          <>
            <ul className="border-border flex flex-col gap-3 border-t pt-6">
              {t.premium.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm">
                  <span className="bg-success/15 text-success mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3.5" aria-hidden="true" strokeWidth={3} />
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

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
          </>
        )}
      </div>
    </Card>
  );
}
