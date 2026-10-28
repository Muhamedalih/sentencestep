"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Gift, Lock, LockOpen, Sparkles } from "lucide-react";

import { LEAN_BUTTON_CLASS, LeanOffer } from "@/components/learning/premium-gate-lean";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import type { GateLean } from "@/lib/billing/gate-lean";
import type { GatePay } from "@/lib/billing/gate-pay";
import { withGateSource } from "@/lib/billing/gate-source";
import type { GateKind } from "@/lib/billing/gate-source";
import type { GateProgress } from "@/lib/progress/honest-numbers";
import { formatDayCount } from "@/lib/i18n/format-days";
import { popIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The card a learner sees when they open a lesson or a word list that is part
 * of Premium. One card, two shapes. On a laptop it is split: the lesson on the
 * left (its own artwork, title and a line about it), and on the right a deep
 * indigo panel, in the site's violet and amber, that says what one payment
 * opens and carries the one button. On a phone the same two halves stack, the
 * panel becoming the lower sheet, so the button is always one thumb away.
 *
 * Everything it says is true: the figures come from the real library (and are
 * left out when too small to quote), the price is the cheapest real plan, the green
 * offer row is there only while an offer really runs (with the same numbers /upgrade
 * shows), and there is no countdown and no promise about refunds.
 *
 * With `lean` (the "leanGate" permission) the panel keeps only what decides a purchase and is drawn
 * by LeanOffer; the lesson half stays, shorter on a phone so the price and the button are in the
 * first screen. Either way both buttons add where they were pressed to the plans page link (see
 * gate-source.ts), so presses can be counted before and after a change.
 *
 * Text blocks use dir="auto" so Arabic reads right to left inside the app's
 * left-to-right layout, the same way the rest of the interface handles it.
 */
export interface PremiumGateProps {
  /** The artwork half on a laptop: the lesson's own illustration, or a brand-coloured stand-in. Fills its box. */
  preview: ReactNode;
  /** The same on a phone, where the banner is short and wide: defaults to `preview`. */
  compactPreview?: ReactNode;
  /** The small label over the artwork, e.g. "Premium lesson". */
  badge: string;
  title: string;
  supportTitle?: string;
  description?: string;
  supportDescription?: string;
  heading: string;
  subheading: string;
  /** Three short lines, each one something Premium really gives. */
  benefits: string[];
  ctaHref: string;
  /** Which kind of lock this is: written on the plans page link, so a press can be counted per kind of lock. */
  lockKind: GateKind;
  /** The cheapest per-month USD price for this visitor's tier, e.g. "$1.17". */
  fromPrice: string;
  /** The running offer, as /upgrade shows it (see getGatePay). */
  pay: GatePay;
  /** What the signed-in learner has done so far, shown as one strip above the price (see getGateProgress); absent for a visitor or a learner who has barely started. */
  progress?: GateProgress | null;
  /** The lean panel's extras when the "leanGate" permission is open for this visitor (see getGateLean); absent: the panel as it always was. */
  lean?: GateLean | null;
  backHref: string;
  backLabel: string;
}

// The panel keeps the same deep indigo in every theme, so its white text always
// reads well; the amber is the site's own accent colour.
const PANEL_BACKGROUND =
  "linear-gradient(155deg, oklch(0.42 0.17 275) 0%, oklch(0.27 0.13 283) 100%)";
const PANEL_GLOW_AMBER = "oklch(0.78 0.16 75 / 0.3)";
const PANEL_GLOW_VIOLET = "oklch(0.62 0.21 290 / 0.55)";
const PANEL_GREEN = "oklch(0.88 0.17 150)";
const PANEL_BAR_BACKGROUND = "oklch(0.27 0.13 283 / 0.94)";

export function PremiumGate({
  preview,
  compactPreview,
  badge,
  title,
  supportTitle,
  description,
  supportDescription,
  heading,
  subheading,
  benefits,
  ctaHref,
  lockKind,
  fromPrice,
  pay,
  progress,
  lean,
  backHref,
  backLabel,
}: PremiumGateProps) {
  const { t, locale } = useLocale();
  const titleId = useId();
  const variant = lean ? "lean" : "classic";
  const gateHref = withGateSource(ctaHref, { from: lockKind, at: "gate", v: variant });
  const barHref = withGateSource(ctaHref, { from: lockKind, at: "bar", v: variant });
  // On a phone the button can sit below the fold: while the real one is out of
  // sight, a slim bar at the bottom carries the price and the same button.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  useEffect(() => {
    const element = ctaRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry?.isIntersecting ?? true),
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // "Plans from {amount} / month": the amount is set large, wherever the language puts it.
  const [priceBefore = "", priceAfter = ""] = t.premium.fromPerMonthCaption.split("{amount}");

  return (
    <motion.section
      variants={popIn}
      initial="hidden"
      animate="visible"
      aria-labelledby={titleId}
      className="border-border bg-card relative isolate mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border shadow-2xl shadow-black/15 md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
    >
      {/* The lesson: artwork, then what it is called and what it is about. */}
      <div className="flex min-w-0 flex-col">
        <div
          className={cn(
            "relative aspect-[16/7] w-full overflow-hidden md:aspect-auto md:min-h-60 md:flex-1",
            lean && "max-md:aspect-[18/5]",
          )}
        >
          <div className="absolute inset-0 max-md:hidden">{preview}</div>
          <div className="absolute inset-0 md:hidden">{compactPreview ?? preview}</div>
          <div
            aria-hidden="true"
            className="from-card/85 pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent"
          />
          <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-md">
            <Sparkles
              className="size-3.5"
              style={{ color: "oklch(0.82 0.15 78)" }}
              aria-hidden="true"
            />
            <span dir="auto">{badge}</span>
          </span>
        </div>

        <div
          className={cn(
            "relative px-6 pt-10 pb-7 md:px-9 md:pt-11 md:pb-9",
            lean && "max-md:pt-4 max-md:pb-5",
          )}
        >
          <div
            className={cn(
              "bg-card text-primary ring-border absolute start-6 -top-6 flex size-12 items-center justify-center rounded-2xl shadow-lg ring-1 md:start-9",
              lean && "max-md:hidden",
            )}
            aria-hidden="true"
          >
            <Lock className="size-5" />
          </div>
          <div
            className={cn(
              lean && "max-md:flex max-md:flex-wrap max-md:items-baseline max-md:gap-x-3",
            )}
          >
            <h1
              id={titleId}
              dir="ltr"
              className={cn(
                "text-2xl leading-tight font-semibold tracking-tight md:text-3xl",
                lean && "max-md:text-xl",
              )}
            >
              {title}
            </h1>
            {supportTitle && (
              <p
                dir="auto"
                className={cn(
                  "text-muted-foreground mt-1.5 text-left text-lg",
                  lean && "max-md:mt-0 max-md:text-base",
                )}
              >
                {supportTitle}
              </p>
            )}
          </div>
          {description && (
            <p
              dir="ltr"
              className={cn(
                "text-muted-foreground mt-3 line-clamp-3 text-sm leading-relaxed",
                lean && "max-md:hidden",
              )}
            >
              {description}
            </p>
          )}
          {supportDescription && (
            <p
              dir="auto"
              className={cn(
                "text-muted-foreground mt-2 line-clamp-3 text-left text-sm leading-relaxed",
                lean && "max-md:hidden",
              )}
            >
              {supportDescription}
            </p>
          )}
        </div>
      </div>

      {/* The offer: what one payment opens, the price, the button. */}
      <div
        className={cn(
          "relative isolate flex min-w-0 flex-col justify-center overflow-hidden p-6 text-white md:p-9",
          lean ? "gap-4" : "gap-5",
        )}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20"
          style={{ background: PANEL_BACKGROUND }}
        />
        {!lean && (
          <>
            <div
              aria-hidden="true"
              className="absolute -end-24 -top-28 -z-10 size-72 rounded-full blur-3xl"
              style={{ background: PANEL_GLOW_AMBER }}
            />
            <div
              aria-hidden="true"
              className="absolute -start-24 -bottom-32 -z-10 size-72 rounded-full blur-3xl"
              style={{ background: PANEL_GLOW_VIOLET }}
            />
          </>
        )}

        {lean ? (
          <LeanOffer
            heading={heading}
            ctaHref={gateHref}
            fromPrice={fromPrice}
            pay={pay}
            progress={progress}
            lean={lean}
            backHref={backHref}
            backLabel={backLabel}
            ctaRef={ctaRef}
          />
        ) : (
          <>
            <p
              className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em]"
              style={{ color: "oklch(0.84 0.14 78)" }}
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              SENTENCESTEP PREMIUM
            </p>

            <div className="flex flex-col gap-2">
              <h2
                dir="auto"
                className="text-2xl leading-tight font-semibold tracking-tight text-balance md:text-[1.7rem]"
              >
                {heading}
              </h2>
              <p dir="auto" className="text-sm leading-relaxed text-pretty text-white/75">
                {subheading}
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  dir="auto"
                  className="flex items-start gap-3 text-sm leading-snug text-white/90"
                >
                  <span
                    className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15"
                    style={{ color: "oklch(0.86 0.14 80)" }}
                    aria-hidden="true"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            {pay.offer && (
              <div
                className="flex flex-col gap-2.5 rounded-xl border px-3.5 py-3"
                style={{
                  color: PANEL_GREEN,
                  borderColor: "oklch(0.8 0.17 150 / 0.4)",
                  backgroundColor: "oklch(0.8 0.17 150 / 0.14)",
                }}
              >
                <p dir="auto" className="flex items-start gap-2 text-sm font-medium">
                  <Gift className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {pay.offer.shared === null
                      ? t.premium.launchOfferBannerPerPlan
                      : t.premium.launchOfferBanner.replace(
                          "{days}",
                          formatDayCount(t.premium, locale, pay.offer.shared),
                        )}
                  </span>
                </p>
                {pay.offer.shared === null && (
                  <ul dir="auto" className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ["1m", t.premium.plan1m],
                        ["3m", t.premium.plan3m],
                        ["6m", t.premium.plan6m],
                      ] as const
                    ).map(([plan, name]) => (
                      <li
                        key={plan}
                        dir="auto"
                        className="flex flex-col items-center gap-0.5 rounded-lg bg-white/10 px-1.5 py-2 text-center"
                      >
                        <span className="text-[11px] text-white/65">{name}</span>
                        <span className="text-xs leading-tight font-medium text-white">
                          {t.premium.launchOfferChip.replace(
                            "{days}",
                            formatDayCount(t.premium, locale, pay.offer!.byPlan[plan]),
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div ref={ctaRef} className="flex flex-col gap-3 border-t border-white/15 pt-5">
              {progress && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      dir="ltr"
                      className="text-[26px] leading-none font-semibold tracking-tight text-white tabular-nums"
                    >
                      {progress.sentences}
                    </span>
                    <p dir="auto" className="text-xs leading-snug text-white/80">
                      <span className="block">{t.premium.gateProgressSentences}</span>
                      {progress.days !== null && (
                        <span className="block">
                          {t.premium.gateProgressDays.replace("{days}", String(progress.days))}
                        </span>
                      )}
                    </p>
                  </div>
                  {progress.reviewFree && (
                    <p dir="auto" className="flex items-center gap-1.5 text-[11.5px] text-white/70">
                      <Check className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>{t.premium.gateReviewFree}</span>
                    </p>
                  )}
                </div>
              )}
              <p
                dir="auto"
                className="flex flex-wrap items-baseline gap-x-1.5 text-sm text-white/70"
              >
                {priceBefore.trim() && <span>{priceBefore.trim()}</span>}
                <span dir="ltr" className="text-3xl font-semibold tracking-tight text-white">
                  {fromPrice}
                </span>
                {priceAfter.trim() && <span>{priceAfter.trim()}</span>}
              </p>

              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 w-full text-base font-semibold shadow-lg shadow-black/25"
              >
                <Link href={gateHref} dir="auto">
                  <LockOpen aria-hidden="true" />
                  {t.premium.gateCta}
                </Link>
              </Button>

              <p dir="auto" className="text-center text-xs text-balance text-white/60">
                {t.premium.gateTrust}
              </p>
            </div>

            <Link
              href={backHref}
              dir="auto"
              className="min-h-11 self-center rounded-md px-3 py-2 text-sm text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            >
              {backLabel}
            </Link>
          </>
        )}
      </div>

      {!ctaVisible && (
        <div
          className="animate-in fade-in slide-in-from-bottom-4 fixed inset-x-0 bottom-0 z-40 border-t border-white/15 px-4 pt-3 backdrop-blur-xl duration-200 md:hidden"
          style={{
            background: PANEL_BAR_BACKGROUND,
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="mx-auto flex max-w-lg items-center gap-3 text-white">
            <p
              dir="auto"
              className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 text-xs text-white/70"
            >
              {priceBefore.trim() && <span>{priceBefore.trim()}</span>}
              <span dir="ltr" className="text-lg font-semibold text-white">
                {fromPrice}
              </span>
              {priceAfter.trim() && <span>{priceAfter.trim()}</span>}
            </p>
            <Button
              asChild
              size="lg"
              className={cn(
                "shrink-0 shadow-lg shadow-black/25",
                lean
                  ? LEAN_BUTTON_CLASS
                  : "bg-accent text-accent-foreground hover:bg-accent/90 font-semibold",
              )}
            >
              <Link href={barHref} dir="auto">
                <LockOpen aria-hidden="true" />
                {t.premium.gateCta}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
