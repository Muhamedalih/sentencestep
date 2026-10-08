"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
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
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";

import { ReportPaymentProblem } from "@/components/billing/report-payment-problem";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { upgradeSignInHref } from "@/lib/billing/after-payment";
import { startCheckout } from "@/lib/billing/checkout-actions";
import type { CheckoutActionState } from "@/lib/billing/checkout-actions";
import type { PlanView } from "@/lib/billing/plan-views";
import type { PlanId } from "@/lib/billing/plans";
import { formatDayCount } from "@/lib/i18n/format-days";
import { isSupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

const initialState: CheckoutActionState = {};

const PLAN_NAME_KEYS = { "1m": "plan1m", "3m": "plan3m", "6m": "plan6m" } as const;

/** The ways to pay that the payment partner's page offers, written the way each brand writes itself, so never translated. */
const ACCEPTED_METHODS = ["Visa", "Mastercard", "Super Qi", "ZainCash", "FIB"] as const;

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
  socialProof?: {
    learners: string | null;
    lessons: string | null;
    rating: { average: string; count: string } | null;
  } | null;
  /** The cheapest price per month across the plans (e.g. "$1.17"), quoted in the comparison line; left out when absent. */
  fromMonthly?: string;
  /**
   * True while the payment partner's page is asked to show dollars. Then a short,
   * positive note is enough; when it will show dinars instead, the longer
   * heads-up about another currency is kept.
   */
  waylShowsDollars?: boolean;
  /** A lesson page (already checked with safeLessonPath) the learner was stopped at: sent with the form so the confirmation page can lead back to it. Never read for anything about the payment. */
  afterPaymentPath?: string | null;
}

/**
 * The /upgrade purchase card: the one place a price is shown (USD only), the
 * plan choice, what the purchase is and is not, and what to expect from the
 * payment partner's page, all before the button. On a phone a pay bar stays at
 * the bottom of the screen while the button itself is out of view. The form
 * only ever submits a plan id; the server decides the price.
 */
export function CheckoutCard({
  plans,
  signedIn,
  extend = false,
  offerNotice = null,
  socialProof = null,
  fromMonthly,
  waylShowsDollars = false,
  afterPaymentPath = null,
}: CheckoutCardProps) {
  const { t, locale } = useLocale();
  const formId = useId();
  const payAreaRef = useRef<HTMLDivElement>(null);
  const [state, formAction, pending] = useActionState(startCheckout, initialState);
  const [selectedId, setSelectedId] = useState<PlanId>(
    () => (plans.find((plan) => plan.preselected) ?? plans[0])!.id,
  );
  const [payAreaVisible, setPayAreaVisible] = useState(true);
  const selected = plans.find((plan) => plan.id === selectedId) ?? plans[0]!;
  const daysLabel = String(selected.days);

  // The phone's pay bar shows only while the real button is off screen, so the
  // two are never visible together.
  useEffect(() => {
    const target = payAreaRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setPayAreaVisible(entry?.isIntersecting ?? true),
      { threshold: 0.1 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const showRating = !extend && socialProof?.rating;
  const showSocialProof =
    !extend && socialProof && (socialProof.learners || socialProof.lessons || socialProof.rating);

  return (
    <>
      <Card className="border-primary/25 gap-0 overflow-hidden rounded-2xl py-0 shadow-lg">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,oklch(0.44_0.2_273),oklch(0.33_0.17_287))] px-6 pt-6 pb-7 text-white">
          <div
            aria-hidden="true"
            className="bg-accent/25 pointer-events-none absolute -end-12 -top-16 size-48 rounded-full blur-3xl"
          />
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-transparent bg-white/15 text-white backdrop-blur-sm">
                <Sparkles aria-hidden="true" />
                {extend ? t.premium.extendHeading : t.common.premium}
              </Badge>
              <Badge className="border-white/25 bg-white/10 text-white">
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
                <span className="text-sm font-medium tracking-wide text-white/80">USD</span>
              </p>
              <p className="mt-2 text-sm text-white/85" dir="auto">
                {t.premium.accessForDays.replace("{days}", daysLabel)}
                <span aria-hidden="true"> · </span>
                {t.premium.perDayCaption.replace("{amount}", selected.perDay)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          {!extend && fromMonthly && (
            <p
              className="bg-success/10 text-foreground flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm"
              dir="auto"
            >
              <TrendingDown className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{t.premium.compareLine.replace("{amount}", fromMonthly)}</span>
            </p>
          )}

          <form id={formId} action={formAction} className="flex flex-col gap-5">
            {afterPaymentPath && <input type="hidden" name="next" value={afterPaymentPath} />}
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
                          {plan.savingsPercent !== null && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="text-success font-medium">
                                {t.premium.saveBadge.replace(
                                  "{percent}",
                                  String(plan.savingsPercent),
                                )}
                              </span>
                            </>
                          )}
                        </span>
                      </span>

                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span dir="ltr" className="text-lg leading-none font-semibold tabular-nums">
                          {plan.price}
                        </span>
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
                <span>
                  {waylShowsDollars
                    ? t.premium.paymentPartnerNoteShort
                    : t.premium.paymentPartnerNote}
                </span>
              </p>
            )}

            <div ref={payAreaRef} className="flex flex-col gap-2">
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
                  <Link href={upgradeSignInHref(afterPaymentPath)}>
                    {t.premium.signInToUpgrade}
                  </Link>
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

            {showSocialProof && socialProof && (
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
                {showRating && socialProof.rating && (
                  <li className="inline-flex items-center gap-1.5">
                    <Star className="text-accent size-3.5 fill-current" aria-hidden="true" />
                    {t.premium.socialProofRating
                      .replace("{rating}", socialProof.rating.average)
                      .replace("{count}", socialProof.rating.count)}
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

            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">{t.premium.acceptedMethodsLabel}</span>
              {ACCEPTED_METHODS.map((method) => (
                <span
                  key={method}
                  dir="ltr"
                  className="border-border text-foreground/80 rounded-md border px-2 py-0.5 font-medium"
                >
                  {method}
                </span>
              ))}
            </div>

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

      {!payAreaVisible && (
        <div
          className="border-border bg-background/95 animate-in fade-in slide-in-from-bottom-4 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur-md duration-200 sm:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1" dir="auto">
              <p className="truncate text-sm font-semibold">
                <span dir="ltr">{selected.price}</span>
                <span aria-hidden="true"> · </span>
                {formatDayCount(t.premium, locale, selected.days)}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {t.premium[PLAN_NAME_KEYS[selected.id]]}
              </p>
            </div>
            {signedIn ? (
              <Button type="submit" form={formId} size="lg" disabled={pending}>
                {!pending && <Lock aria-hidden="true" />}
                {pending ? t.premium.redirecting : t.premium.payShort}
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href={upgradeSignInHref(afterPaymentPath)}>{t.premium.signInToUpgrade}</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
