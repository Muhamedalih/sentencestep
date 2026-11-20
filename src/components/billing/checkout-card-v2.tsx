"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  CreditCard,
  Gem,
  Gift,
  ListChecks,
  Lock,
  MapPin,
  MessageSquareText,
  RefreshCcwDot,
  Smartphone,
  Sparkles,
  Star,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";

import { PayStrip } from "@/components/auth/in-app-browser-strip";
import { BinanceMark } from "@/components/billing/binance-mark";
import { BinanceReportPrompt } from "@/components/billing/binance-report-prompt";
import { ReportPaymentProblem } from "@/components/billing/report-payment-problem";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { upgradeSignInHref } from "@/lib/billing/after-payment";
import { premiumBenefits } from "@/lib/billing/benefits";
import { startCheckout } from "@/lib/billing/checkout-actions";
import type { CheckoutActionState } from "@/lib/billing/checkout-actions";
import { checkoutV2Strings } from "@/lib/billing/checkout-v2-strings";
import {
  BINANCE_PAY_METHOD,
  CARD_METHODS,
  EGYPT_WALLET_METHOD,
  IRAQI_WALLET_METHODS,
} from "@/lib/billing/pay-methods";
import type { PlanView } from "@/lib/billing/plan-views";
import type { PlanId } from "@/lib/billing/plans";
import { formatDayCount } from "@/lib/i18n/format-days";
import { isSupportLocale } from "@/lib/i18n/locales";
import type { StripDecision } from "@/lib/in-app-strip/strip";
import { cn } from "@/lib/utils";

const initialState: CheckoutActionState = {};

const PLAN_NAME_KEYS = { "1m": "plan1m", "3m": "plan3m", "6m": "plan6m" } as const;

type Method = "card" | "binance" | "egypt";

interface CheckoutCardV2Props {
  /** Prepared on the server for the visitor's tier: every figure is already formatted, in USD. */
  plans: PlanView[];
  /** Signed-in visitors get the checkout form; everyone else a sign-in link. */
  signedIn: boolean;
  /** True once the Passages section is open to everyone: the benefit list then says a subscriber gets all of it. */
  passagesOpen?: boolean;
  /** The real rating over every section and the number of accounts, already rounded and formatted; a field is null when too small to quote. */
  proof?: {
    rating: { average: string; count: string } | null;
    learners: string | null;
  } | null;
  /** True while the payment partner's page is asked to show dollars (then a shorter note is enough). */
  waylShowsDollars?: boolean;
  /** True for a visitor in Iraq, who is shown the Iraqi wallets beside cards. */
  showIraqiWallets?: boolean;
  /** A lesson page (already checked with safeLessonPath) the learner was stopped at. */
  afterPaymentPath?: string | null;
  /** True when Binance Pay is open for this visitor. The server re-checks when the form is posted. */
  binancePayOpen?: boolean;
  /** True when Vodafone Cash is open for this visitor. The server re-checks when the form is posted. */
  egyptWalletOpen?: boolean;
  /** True for a visitor whose country is Egypt: Vodafone Cash starts chosen (still free to change). */
  preferEgyptWallet?: boolean;
  /** Set (see decidePayStrip) for a learner inside Facebook's or Instagram's browser: the "finish your payment in your browser" strip then shows above the Pay button while paying by card. */
  payStrip?: StripDecision | null;
}

const STAR_PATH = "M12 3.2l2.5 5.6 6.1.6-4.6 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6-4.6-4.1 6.1-.6z";

/** Five golden stars filled by the average (the last one partly), drawn left to right whatever the language. */
function Stars({ value, label }: { value: number; label: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <span dir="ltr" role="img" aria-label={label} className="inline-flex gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.min(1, Math.max(0, value - index));
        return (
          <svg key={index} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={`${id}-${index}`}>
                <stop offset={fill} stopColor="#f6b533" />
                <stop offset={fill} stopColor="#ffffff" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <path
              d={STAR_PATH}
              fill={`url(#${id}-${index})`}
              stroke={fill > 0 ? "#f6b533" : "none"}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}

/**
 * The one-screen /upgrade purchase card (permission checkoutV2): a solid header with the price and the
 * real rating, one price-context line, a "what you get" list that opens on a tap, three plan tiles, three
 * payment tiles in a row and a larger pay button. Same form as the old card: it only ever submits a plan
 * id and a method; the server decides the price.
 */
export function CheckoutCardV2({
  plans,
  signedIn,
  passagesOpen = false,
  proof = null,
  waylShowsDollars = false,
  showIraqiWallets = false,
  afterPaymentPath = null,
  binancePayOpen = false,
  egyptWalletOpen = false,
  preferEgyptWallet = false,
  payStrip = null,
}: CheckoutCardV2Props) {
  const { t, locale } = useLocale();
  const v2 = checkoutV2Strings(locale);
  const formId = useId();
  const payAreaRef = useRef<HTMLDivElement>(null);
  const [state, formAction, pending] = useActionState(startCheckout, initialState);
  const startsWithEgypt = signedIn && egyptWalletOpen && preferEgyptWallet;
  const [method, setMethod] = useState<Method>(startsWithEgypt ? "egypt" : "card");
  const [pickedByCountry, setPickedByCountry] = useState(startsWithEgypt);
  const [selectedId, setSelectedId] = useState<PlanId>(
    () => (plans.find((plan) => plan.preselected) ?? plans[0])!.id,
  );
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const [payAreaVisible, setPayAreaVisible] = useState(true);
  const selected = plans.find((plan) => plan.id === selectedId) ?? plans[0]!;
  const daysLabel = String(selected.days);

  // The phone's pay bar shows only while the real button is off screen, so the two are never visible together.
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

  // Back from the payment partner's page can restore this page frozen on "Redirecting…" with a dead
  // button; a fresh load gives a working one.
  const pendingRef = useRef(false);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && pendingRef.current) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const cardMethods = showIraqiWallets ? [...CARD_METHODS, ...IRAQI_WALLET_METHODS] : CARD_METHODS;
  const showMethodChoice = signedIn && (binancePayOpen || egyptWalletOpen);
  const acceptedMethods = [
    ...cardMethods,
    ...(binancePayOpen ? [BINANCE_PAY_METHOD] : []),
    ...(egyptWalletOpen ? [EGYPT_WALLET_METHOD] : []),
  ];
  const paysByCard = !showMethodChoice || method === "card";

  const tiles: { id: Method; name: string; icon: ReactNode }[] = [
    {
      id: "card",
      name: t.binancePay.cardTileTitle,
      icon: <CreditCard className="size-5" aria-hidden="true" />,
    },
    ...(binancePayOpen
      ? [
          {
            id: "binance" as const,
            name: BINANCE_PAY_METHOD,
            icon: <BinanceMark className="size-5" />,
          },
        ]
      : []),
    ...(egyptWalletOpen
      ? [
          {
            id: "egypt" as const,
            name: EGYPT_WALLET_METHOD,
            icon: <Smartphone className="size-5" aria-hidden="true" />,
          },
        ]
      : []),
  ];
  // A visitor in Egypt sees their own wallet first.
  if (preferEgyptWallet) tiles.sort((a, b) => Number(b.id === "egypt") - Number(a.id === "egypt"));

  const amountLabel = paysByCard
    ? selected.price
    : method === "egypt"
      ? `${selected.egp} ${v2.egpUnit}`
      : `${selected.usdt} USDT`;
  const payLabel = paysByCard
    ? v2.payNow
    : v2.payVia.replace("{method}", method === "egypt" ? EGYPT_WALLET_METHOD : BINANCE_PAY_METHOD);

  const ratingValue = proof?.rating ? Number(proof.rating.average) : 0;
  const benefits = premiumBenefits(t.premium, passagesOpen);

  return (
    <>
      <Card className="border-border gap-0 overflow-hidden rounded-2xl py-0 shadow-lg">
        <div className="bg-[oklch(0.38_0.17_277)] px-5 pt-5 pb-5 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-transparent bg-white/15 text-white">
              <Sparkles aria-hidden="true" />
              {t.common.premium}
            </Badge>
            <Badge className="border-white/25 bg-white/10 text-white">
              {t.premium.oneTimeBadge}
            </Badge>
          </div>

          <div aria-live="polite" className="mt-3">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span
                dir="ltr"
                className="text-6xl leading-none font-semibold tracking-tight tabular-nums"
              >
                {selected.price}
              </span>
              <span className="text-sm font-medium tracking-wide text-white/75">USD</span>
            </p>
            <p className="mt-2 text-sm text-white/85" dir="auto">
              {t.premium.accessForDays.replace("{days}", daysLabel)}
              <span aria-hidden="true"> · </span>
              {t.premium.perDayCaption.replace("{amount}", selected.perDay)}
            </p>
          </div>

          {proof && (proof.rating || proof.learners) && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/15 bg-black/30 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              {proof.rating && (
                <div className="flex items-center gap-3 sm:flex-col sm:gap-1.5">
                  <span dir="ltr" className="text-4xl leading-none font-semibold tabular-nums">
                    {proof.rating.average}
                  </span>
                  <Stars
                    value={ratingValue}
                    label={v2.ratingAria.replace("{rating}", proof.rating.average)}
                  />
                </div>
              )}
              {proof.rating && proof.learners && (
                <span
                  aria-hidden="true"
                  className="hidden h-12 w-px self-center bg-white/20 sm:block"
                />
              )}
              <ul className="flex flex-row flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/90 sm:flex-col sm:gap-2">
                {proof.rating && (
                  <li className="inline-flex items-center gap-2" dir="auto">
                    <MessageSquareText className="size-4 text-white/60" aria-hidden="true" />
                    {v2.ratingsLine.replace("{count}", proof.rating.count)}
                  </li>
                )}
                {proof.learners && (
                  <li className="inline-flex items-center gap-2" dir="auto">
                    <Users className="size-4 text-white/60" aria-hidden="true" />
                    {v2.subscribersLine.replace("{count}", proof.learners)}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <p
            className="bg-success/10 border-success/25 text-foreground flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed"
            dir="auto"
          >
            <TrendingDown className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{v2.compareLine.replace("{amount}", selected.perMonth)}</span>
          </p>

          <div className="border-border bg-card overflow-hidden rounded-xl border">
            <button
              type="button"
              onClick={() => setBenefitsOpen((open) => !open)}
              aria-expanded={benefitsOpen}
              aria-controls={`${formId}-benefits`}
              className="hover:bg-muted/50 flex w-full items-center gap-2.5 px-3.5 py-3 text-start text-sm transition-colors"
            >
              <ListChecks className="text-primary size-5 shrink-0" aria-hidden="true" />
              <span className="flex-1 font-medium">{v2.whatYouGet}</span>
              <ChevronDown
                className={cn(
                  "text-muted-foreground size-4 shrink-0 transition-transform duration-300",
                  benefitsOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
            <div
              id={`${formId}-benefits`}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                benefitsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <ul className="flex min-h-0 flex-col gap-2.5 overflow-hidden px-3.5">
                {benefits.map((benefit, index) => (
                  <li
                    key={benefit}
                    className={cn(
                      "flex items-start gap-2.5 text-sm leading-relaxed",
                      index === 0 && "pt-1",
                      index === benefits.length - 1 && "pb-3.5",
                    )}
                  >
                    <span className="bg-success/15 text-success mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="size-3.5" aria-hidden="true" strokeWidth={3} />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <form id={formId} action={formAction} className="flex flex-col gap-4">
            {afterPaymentPath && <input type="hidden" name="next" value={afterPaymentPath} />}

            <fieldset className="flex flex-col gap-2">
              <legend className="text-muted-foreground mb-2.5 text-xs font-semibold">
                {t.premium.choosePlanHeading}
              </legend>
              <div className="grid grid-cols-3 gap-2.5 pt-2">
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
                          "flex h-full flex-col items-center gap-0.5 rounded-xl border px-1.5 pt-4 pb-3 text-center transition-all duration-200",
                          "peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
                          "hover:-translate-y-0.5 active:scale-[0.97]",
                          checked
                            ? "border-primary bg-primary/10 ring-primary/15 ring-4"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute end-2 top-2 flex size-4 items-center justify-center rounded-full border-[1.5px] transition-colors",
                            checked ? "border-primary bg-primary" : "border-muted-foreground/40",
                          )}
                        >
                          {checked && (
                            <Check className="text-primary-foreground size-2.5" strokeWidth={4} />
                          )}
                        </span>
                        <span className="text-muted-foreground text-[13px]">
                          {t.premium[PLAN_NAME_KEYS[plan.id]]}
                        </span>
                        <span dir="ltr" className="text-2xl font-semibold tabular-nums">
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground text-[11px]" dir="auto">
                          {t.premium.perMonthCaption.replace("{amount}", plan.perMonth)}
                        </span>
                        {plan.savingsPercent !== null && (
                          <span className="text-success text-[11px] font-medium" dir="auto">
                            {t.premium.saveBadge.replace("{percent}", String(plan.savingsPercent))}
                          </span>
                        )}
                      </div>
                      {plan.badge === "recommended" && (
                        <span className="bg-primary text-primary-foreground absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
                          <Star className="size-3" aria-hidden="true" />
                          {v2.mostChosen}
                        </span>
                      )}
                      {plan.badge === "best-value" && (
                        <span className="bg-success/15 text-success border-success/40 absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
                          <Gem className="size-3" aria-hidden="true" />
                          {t.premium.bestValueBadge}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {selected.bonusDays > 0 && (
                <p
                  className="text-success mt-1 flex items-center justify-center gap-1.5 text-center text-xs"
                  dir="auto"
                >
                  <Gift className="size-3.5 shrink-0" aria-hidden="true" />
                  {v2.giftLine
                    .replace("{gift}", formatDayCount(t.premium, locale, selected.bonusDays))
                    .replace("{total}", formatDayCount(t.premium, locale, selected.days))}
                </p>
              )}
            </fieldset>

            {showMethodChoice && (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-muted-foreground mb-2.5 text-xs font-semibold">
                  {t.binancePay.methodHeading}
                </legend>
                <div
                  className="grid gap-2.5"
                  style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}
                >
                  {tiles.map((tile) => {
                    const checked = method === tile.id;
                    return (
                      <label key={tile.id} className="relative block cursor-pointer">
                        <input
                          type="radio"
                          name="method"
                          value={tile.id}
                          checked={checked}
                          onChange={() => {
                            setMethod(tile.id);
                            setPickedByCountry(false);
                          }}
                          className="peer sr-only"
                        />
                        <div
                          className={cn(
                            "flex h-full flex-col items-center gap-1.5 rounded-xl border px-1.5 py-3 text-center text-[13px] transition-all duration-200",
                            "peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
                            "hover:-translate-y-0.5 active:scale-[0.97]",
                            checked
                              ? "border-primary bg-primary/10 ring-primary/15 text-foreground ring-4"
                              : "border-border bg-card text-foreground/85 hover:border-primary/40",
                          )}
                        >
                          <span className={checked ? "text-primary" : "text-muted-foreground"}>
                            {tile.icon}
                          </span>
                          <span dir="auto">
                            {tile.id === "card" ? tile.name : <bdi dir="ltr">{tile.name}</bdi>}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {pickedByCountry && method === "egypt" && (
                  <p className="text-success flex items-center gap-1.5 text-xs" dir="auto">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    {v2.autoPicked}
                  </p>
                )}
              </fieldset>
            )}

            {signedIn && paysByCard && payStrip && <PayStrip decision={payStrip} />}

            <div ref={payAreaRef} className="flex flex-col gap-2.5">
              {signedIn ? (
                <Button
                  type="submit"
                  size="lg"
                  disabled={pending}
                  className={cn(
                    "group relative h-14 w-full justify-between overflow-hidden rounded-2xl ps-5 pe-2 text-base font-semibold transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:scale-[0.985]",
                    "after:absolute after:inset-y-0 after:-left-20 after:w-14 after:-skew-x-[20deg] after:bg-white/25 after:transition-[left] after:duration-700 hover:after:left-[110%]",
                  )}
                >
                  {pending ? (
                    <span className="mx-auto" dir="auto">
                      {t.premium.redirecting}
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-2.5" dir="auto">
                        <Lock className="size-5" aria-hidden="true" />
                        {payLabel}
                      </span>
                      <span className="flex h-10 items-center gap-2 rounded-xl bg-black/80 px-3.5 text-sm font-medium text-white">
                        <span dir="ltr">{amountLabel}</span>
                        <span aria-hidden="true" className="text-white/50">
                          ·
                        </span>
                        <span dir="auto">{formatDayCount(t.premium, locale, selected.days)}</span>
                      </span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="h-14 w-full rounded-2xl text-base font-semibold"
                >
                  <Link href={upgradeSignInHref(afterPaymentPath)}>
                    {t.premium.signInToUpgrade}
                  </Link>
                </Button>
              )}
              {state?.error && (
                <p
                  role="alert"
                  className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-center text-sm"
                  dir="auto"
                >
                  {state.error}
                </p>
              )}
              {signedIn && paysByCard && (
                <p
                  className="text-muted-foreground text-center text-[11px] leading-relaxed"
                  dir="auto"
                >
                  {waylShowsDollars
                    ? t.premium.paymentPartnerNoteShort
                    : t.premium.paymentPartnerNote}
                </p>
              )}
            </div>

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

            {!showMethodChoice && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
                <span className="text-muted-foreground">{t.premium.acceptedMethodsLabel}</span>
                {acceptedMethods.map((name) => (
                  <span
                    key={name}
                    dir="ltr"
                    className="border-border text-foreground/80 rounded-md border px-2 py-0.5 font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
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
          </form>

          {signedIn &&
            (showMethodChoice && method === "binance" ? (
              <BinanceReportPrompt />
            ) : (
              <div className="-mt-2 flex justify-center">
                <ReportPaymentProblem />
              </div>
            ))}
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
