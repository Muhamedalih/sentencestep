"use client";

import { Fragment, useActionState, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Headphones,
  Languages,
  Library,
  ListOrdered,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";

import { PayStrip } from "@/components/auth/in-app-browser-strip";
import {
  BinanceTile,
  MastercardPlate,
  VisaPlate,
  VodafoneTile,
} from "@/components/billing/payment-logos";
import { useLocale } from "@/components/providers/locale-provider";
import { upgradeSignInHref } from "@/lib/billing/after-payment";
import { startCheckout } from "@/lib/billing/checkout-actions";
import type { CheckoutActionState } from "@/lib/billing/checkout-actions";
import {
  BINANCE_PAY_METHOD,
  EGYPT_WALLET_METHOD,
  IRAQI_WALLET_METHODS,
} from "@/lib/billing/pay-methods";
import type { PlanView } from "@/lib/billing/plan-views";
import type { PlanId } from "@/lib/billing/plans";
import { loadUpgradeModal } from "@/lib/billing/upgrade-modal-actions";
import type { UpgradeModalData } from "@/lib/billing/upgrade-modal-actions";
import { upgradeModalStrings } from "@/lib/billing/upgrade-modal-strings";
import type { UpgradeModalStrings } from "@/lib/billing/upgrade-modal-strings";
import { isSupportLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/** What opened the pop-up: the address of a plans link, or a locked card's own lesson page. */
export interface UpgradeModalRequest {
  /** The query string of the plans link that was pressed ("" for a locked card). */
  search: string;
  /** The lesson page a locked card stands for, so paying can lead back to it. */
  next: string | null;
  /** Where the press would have gone without the pop-up: used when the pop-up cannot open. */
  fallbackHref: string;
}

const initialState: CheckoutActionState = {};
const PLAN_NAME_KEYS = { "1m": "plan1m", "3m": "plan3m", "6m": "plan6m" } as const;
const PLAN_MONTHS: Record<PlanId, number> = { "1m": 1, "3m": 3, "6m": 6 };

type Method = "card" | "binance" | "egypt";

const STAR_PATH = "M12 3.2l2.5 5.6 6.1.6-4.6 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6-4.6-4.1 6.1-.6z";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The same words with each {name} replaced by a node, so an amount can keep its own left-to-right direction. */
function Template({ text, values }: { text: string; values: Record<string, ReactNode> }) {
  return (
    <>
      {text.split(/(\{\w+\})/).map((part, index) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1];
        if (name && name in values) return <Fragment key={index}>{values[name]}</Fragment>;
        return part ? <Fragment key={index}>{part}</Fragment> : null;
      })}
    </>
  );
}

function Amount({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <bdi className={cn(strong && "font-medium text-white")}>{children}</bdi>;
}

/** Five golden stars filled by the average (the last one partly) that shine one after the other. */
function ShiningStars({ value, label }: { value: number; label: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <span dir="ltr" role="img" aria-label={label} className="inline-flex gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.min(1, Math.max(0, value - index));
        return (
          <svg
            key={index}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="upgrade-star"
            style={{ animationDelay: `${index * 0.18}s` }}
          >
            <defs>
              <linearGradient id={`${id}-${index}`}>
                <stop offset={fill} stopColor="#f6b533" />
                <stop offset={fill} stopColor="#ffffff" stopOpacity="0.22" />
              </linearGradient>
            </defs>
            <path
              d={STAR_PATH}
              fill={`url(#${id}-${index})`}
              stroke={fill > 0 ? "#f6b533" : "none"}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}

const BIG_BUTTON =
  "flex h-[68px] w-full items-center justify-center rounded-[20px] bg-[#ececf0] px-4 text-[19px] font-bold text-[#101114] shadow-[0_8px_28px_rgba(255,255,255,0.1),0_6px_18px_rgba(0,0,0,0.5)] outline-none transition duration-150 hover:-translate-y-px hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171d] active:scale-[0.985] disabled:opacity-70 sm:text-[21px]";

/** The egp price of a plan per month, in whole pounds. */
function egpPerMonth(plan: PlanView): number {
  return Math.round(Number(plan.egp) / PLAN_MONTHS[plan.id]);
}

export function UpgradeModal({
  request,
  onClose,
}: {
  request: UpgradeModalRequest;
  onClose: () => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const s = upgradeModalStrings(locale);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<UpgradeModalData | null>(null);

  // The figures come from the server only now that the pop-up is open; if there are none (the
  // permission closed, already subscribed, an error) the press goes where it always went.
  useEffect(() => {
    let active = true;
    const fallback = () => {
      if (!active) return;
      onClose();
      router.push(request.fallbackHref);
    };
    loadUpgradeModal(request.search, request.next)
      .then((result) => {
        if (!active) return;
        if (!result) fallback();
        else setData(result);
      })
      .catch(fallback);
    return () => {
      active = false;
    };
  }, [request, router, onClose]);

  // Escape closes, Tab stays inside, the page behind does not scroll, and focus goes back where it was.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (item) => item.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const current = document.activeElement;
      if (event.shiftKey && (current === first || current === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (before && document.contains(before)) before.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-in fade-in slide-in-from-bottom-6 relative max-h-[94dvh] w-full max-w-[470px] overflow-y-auto rounded-t-[26px] border border-[#2a2c37] bg-[#16171d] px-5 pt-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white duration-200 outline-none sm:rounded-[26px] sm:px-[22px]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={s.close}
          className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full border border-[#2f313d] bg-[#1b1c23] text-[#d6d7e0] transition-colors outline-none hover:bg-[#23252e] focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-[18px]" aria-hidden="true" />
        </button>

        {data ? (
          <Content
            key={request.search + request.next}
            data={data}
            request={request}
            s={s}
            titleId={titleId}
          />
        ) : (
          <OfferShell
            s={s}
            titleId={titleId}
            data={null}
            cta={<div className="h-[68px] animate-pulse rounded-[20px] bg-white/15" />}
          />
        )}
      </div>
    </div>
  );
}

/** Step one's text, shared by the loading state and the loaded one. */
function OfferShell({
  s,
  titleId,
  data,
  cta,
}: {
  s: UpgradeModalStrings;
  titleId: string;
  data: UpgradeModalData | null;
  cta: ReactNode;
}) {
  const best = data?.plans.find((plan) => plan.badge === "best-value") ?? data?.plans.at(-1);
  const benefits: { icon: ReactNode; text: string }[] = [
    { icon: <Library className="size-[18px]" aria-hidden="true" />, text: s.benefitStories },
    { icon: <ListOrdered className="size-[18px]" aria-hidden="true" />, text: s.benefitLessons },
    { icon: <Languages className="size-[18px]" aria-hidden="true" />, text: s.benefitWordLists },
    ...(data
      ? [
          data.passagesOpen
            ? {
                icon: <Headphones className="size-[18px]" aria-hidden="true" />,
                text: s.benefitPassages,
              }
            : {
                icon: <Sparkles className="size-[18px]" aria-hidden="true" />,
                text: s.benefitNewFeatures,
              },
        ]
      : []),
  ];

  return (
    <>
      <h2
        id={titleId}
        dir="auto"
        className="mt-1 mb-1.5 text-center text-[26px] leading-[1.3] font-medium"
      >
        {s.heading}
      </h2>
      <p dir="auto" className="mb-2.5 text-center text-sm text-[#a9acc0]">
        {s.subheading}
      </p>
      <div className="mb-[18px] flex h-6 items-center justify-center gap-2 text-[12.5px] text-[#a9acc0]">
        {data?.rating && (
          <>
            <span dir="auto">{s.ratingsLine.replace("{count}", data.rating.count)}</span>
            <span aria-hidden="true">·</span>
            <b dir="ltr" className="text-sm font-medium text-white">
              {data.rating.average}
            </b>
            <ShiningStars
              value={Number(data.rating.average)}
              label={s.ratingAria.replace("{rating}", data.rating.average)}
            />
          </>
        )}
      </div>

      <ul className="mb-[18px] overflow-hidden rounded-[18px] border border-[#2a2c37]">
        {benefits.map((benefit) => (
          <li
            key={benefit.text}
            className="flex items-center gap-3 border-t border-[#2a2c37] px-3.5 py-3 first:border-t-0"
          >
            <span
              aria-hidden="true"
              className="grid size-[38px] shrink-0 place-items-center rounded-[11px] border border-[#30323f] bg-[#232530] text-[#e6e7ef]"
            >
              {benefit.icon}
            </span>
            <span dir="auto" className="text-[14.5px] leading-6 font-medium">
              {benefit.text}
            </span>
          </li>
        ))}
      </ul>

      {best && (
        <p dir="auto" className="mb-4 text-center text-[13px] leading-7 text-[#a9acc0]">
          <Template
            text={s.compareLine}
            values={{ amount: <Amount strong>{best.perMonth}</Amount> }}
          />
        </p>
      )}

      {cta}
      <p dir="auto" className="mt-3.5 text-center text-[11.5px] text-[#8a8da1]">
        {s.trustLine}
      </p>
    </>
  );
}

function Content({
  data,
  request,
  s,
  titleId,
}: {
  data: UpgradeModalData;
  request: UpgradeModalRequest;
  s: UpgradeModalStrings;
  titleId: string;
}) {
  const { t, locale } = useLocale();
  const formId = useId();
  const [step, setStep] = useState<"offer" | "pay">("offer");
  const [state, formAction, pending] = useActionState(startCheckout, initialState);
  const best = data.plans.find((plan) => plan.badge === "best-value") ?? data.plans.at(-1)!;
  const startsWithEgypt = data.signedIn && data.egyptWalletOpen && data.preferEgyptWallet;
  const [selectedId, setSelectedId] = useState<PlanId>(best.id);
  const [method, setMethod] = useState<Method>(startsWithEgypt ? "egypt" : "card");
  const [pickedByCountry, setPickedByCountry] = useState(startsWithEgypt);
  const selected = data.plans.find((plan) => plan.id === selectedId) ?? best;

  // Back from the payment partner's page can restore this page frozen on "Redirecting…"; a fresh load is a working one.
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

  const startAmount = startsWithEgypt ? `${egpPerMonth(best)} ${s.egpUnit}` : best.perMonth;

  if (step === "offer") {
    const cta = data.signedIn ? (
      <button type="button" autoFocus onClick={() => setStep("pay")} className={BIG_BUTTON}>
        <span dir="auto">
          <Template text={s.startFrom} values={{ amount: <Amount>{startAmount}</Amount> }} />
        </span>
      </button>
    ) : (
      <Link href={upgradeSignInHref(request.next ?? data.next)} className={BIG_BUTTON}>
        <span dir="auto">
          <Template text={s.startFrom} values={{ amount: <Amount>{startAmount}</Amount> }} />
        </span>
      </Link>
    );
    return <OfferShell s={s} titleId={titleId} data={data} cta={cta} />;
  }

  const cardDescription = data.showIraqiWallets
    ? `Visa · Mastercard · ${IRAQI_WALLET_METHODS.join(" · ")}`
    : s.cardDesc;
  const methods: {
    id: Method;
    name: string;
    description: string;
    logo: ReactNode;
    extra?: ReactNode;
  }[] = [
    {
      id: "card",
      name: s.cardTitle,
      description: cardDescription,
      logo: (
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-[11px] border border-[#30323f] bg-[#232530] text-[#e6e7ef]"
        >
          <CreditCard className="size-5" />
        </span>
      ),
      extra: (
        <span className="flex gap-1.5">
          <VisaPlate />
          <MastercardPlate />
        </span>
      ),
    },
    ...(data.binancePayOpen
      ? [
          {
            id: "binance" as const,
            name: BINANCE_PAY_METHOD,
            description: s.binanceDesc,
            logo: <BinanceTile className="size-10 shrink-0 rounded-[11px]" />,
          },
        ]
      : []),
    ...(data.egyptWalletOpen
      ? [
          {
            id: "egypt" as const,
            name: EGYPT_WALLET_METHOD,
            description: s.egyptDesc,
            logo: <VodafoneTile className="size-10 shrink-0 overflow-hidden rounded-[11px]" />,
          },
        ]
      : []),
  ];
  if (data.preferEgyptWallet)
    methods.sort((a, b) => Number(b.id === "egypt") - Number(a.id === "egypt"));

  const amount =
    method === "egypt"
      ? `${selected.egp} ${s.egpUnit}`
      : method === "binance"
        ? `${selected.usdt} USDT`
        : selected.price;
  const methodName = method === "egypt" ? EGYPT_WALLET_METHOD : BINANCE_PAY_METHOD;
  const paysByCard = method === "card";

  return (
    <form id={formId} action={formAction} className="flex flex-col">
      {(request.next ?? data.next) && (
        <input type="hidden" name="next" value={(request.next ?? data.next)!} />
      )}
      <button
        type="button"
        onClick={() => setStep("offer")}
        aria-label={s.back}
        className="absolute top-4 left-4 z-10 grid size-9 place-items-center rounded-full text-[#d6d7e0] transition-colors outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>
      <h2
        id={titleId}
        dir="auto"
        className="mt-1 mb-1.5 text-center text-[26px] leading-[1.3] font-medium"
      >
        {s.chooseHeading}
      </h2>
      <p dir="auto" className="mb-[18px] text-center text-sm text-[#a9acc0]">
        {s.chooseSub}
      </p>

      <fieldset className="mb-[18px] overflow-hidden rounded-[18px] border border-[#2a2c37]">
        {data.plans.map((plan) => {
          const checked = plan.id === selectedId;
          const perMonthBig = method === "egypt" ? String(egpPerMonth(plan)) : plan.perMonth;
          const perMonthUnit = method === "egypt" ? s.egpPerMonth : s.perMonth;
          const total =
            method === "egypt"
              ? `${plan.egp} ${s.egpUnit}`
              : method === "binance"
                ? `${plan.usdt} USDT`
                : plan.price;
          const tag =
            plan.badge === "recommended"
              ? { text: s.mostChosen, bg: "#6f7dff", color: "#ffffff" }
              : plan.badge === "best-value"
                ? { text: s.bestValue, bg: "#34c27a", color: "#06210f" }
                : null;
          return (
            <label
              key={plan.id}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 border-t border-[#2a2c37] px-3.5 pt-[21px] pb-3.5 transition-colors first:border-t-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white has-[:focus-visible]:ring-inset",
                checked && "bg-[#202129] shadow-[inset_0_0_0_1.5px_#fff]",
              )}
            >
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={checked}
                onChange={() => setSelectedId(plan.id)}
                className="sr-only"
              />
              {tag && (
                <span
                  dir="auto"
                  className="absolute top-0 left-0 rounded-br-[10px] px-2.5 pt-0.5 pb-[3px] text-[11px] font-medium"
                  style={{ background: tag.bg, color: tag.color }}
                >
                  {tag.text}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span dir="auto" className="block text-[15px] font-medium">
                  {t.premium[PLAN_NAME_KEYS[plan.id]]}
                </span>
                <span dir="auto" className="mt-0.5 block text-xs text-[#a9acc0]">
                  <Template text={s.payOnce} values={{ amount: <Amount>{total}</Amount> }} />
                </span>
              </span>
              <span dir="ltr" className="flex shrink-0 items-baseline gap-1 text-xs text-[#a9acc0]">
                <span className="text-xl font-medium text-white tabular-nums">{perMonthBig}</span>
                <span dir="auto">{perMonthUnit}</span>
              </span>
              <Radio checked={checked} />
            </label>
          );
        })}
      </fieldset>

      <p dir="auto" className="mb-2 text-center text-[12.5px] text-[#a9acc0]">
        {s.methodHeading}
      </p>
      <fieldset className="mb-[18px] overflow-hidden rounded-[18px] border border-[#2a2c37]">
        {methods.map((item) => {
          const checked = item.id === method;
          return (
            <label
              key={item.id}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 border-t border-[#2a2c37] px-3.5 py-3 transition-colors first:border-t-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white has-[:focus-visible]:ring-inset",
                checked && "bg-[#202129] shadow-[inset_0_0_0_1.5px_#fff]",
              )}
            >
              <input
                type="radio"
                name="method"
                value={item.id}
                checked={checked}
                onChange={() => {
                  setMethod(item.id);
                  setPickedByCountry(false);
                }}
                className="sr-only"
              />
              {item.logo}
              <span className="min-w-0 flex-1">
                <span dir="auto" className="block text-[15px] font-medium">
                  {item.id === "card" ? item.name : <bdi dir="ltr">{item.name}</bdi>}
                </span>
                <span dir="auto" className="mt-0.5 flex items-center gap-1 text-xs text-[#a9acc0]">
                  {item.id === "egypt" && checked && pickedByCountry ? (
                    <>
                      <MapPin className="size-3 shrink-0" aria-hidden="true" />
                      {s.autoPicked}
                    </>
                  ) : (
                    item.description
                  )}
                </span>
              </span>
              {item.extra}
              <Radio checked={checked} />
            </label>
          );
        })}
      </fieldset>

      {paysByCard && data.payStrip && (
        <div className="text-foreground mb-3">
          <PayStrip decision={data.payStrip} />
        </div>
      )}

      <button type="submit" disabled={pending} className={BIG_BUTTON}>
        {pending ? (
          <span dir="auto">{s.redirecting}</span>
        ) : (
          <span dir="auto">
            <Template
              text={paysByCard ? s.pay : s.payVia}
              values={{
                amount: <Amount>{amount}</Amount>,
                method: <Amount>{methodName}</Amount>,
              }}
            />
          </span>
        )}
      </button>
      {state?.error && (
        <p
          role="alert"
          dir="auto"
          className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-center text-sm text-red-300"
        >
          {state.error}
        </p>
      )}
      <p dir="auto" className="mt-3.5 text-center text-[11.5px] text-[#8a8da1]">
        {s.trustLine}
      </p>
      <p dir="auto" className="mt-2 text-center text-[11px] leading-relaxed text-[#7d8093]">
        {t.premium.termsNoticePrefix}
        <Link
          href={locale && isSupportLocale(locale) ? `/${locale}/terms` : "/terms"}
          prefetch={false}
          className="underline underline-offset-2"
        >
          {t.premium.termsNoticeLink}
        </Link>
        {t.premium.termsNoticeSuffix}
      </p>
    </form>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-all duration-150",
        checked ? "border-white bg-white text-[#16171d]" : "border-[#5a5d70]",
      )}
    >
      <Check
        className={cn(
          "size-3.5 transition-all duration-150",
          checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
        strokeWidth={3.5}
      />
    </span>
  );
}
