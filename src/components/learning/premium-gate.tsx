"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Lock, LockOpen, Sparkles } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { popIn } from "@/lib/motion";

/**
 * The card a learner sees when they open a lesson or a word list that is part
 * of Premium. One card, two shapes. On a laptop it is split: the lesson on the
 * left (its own artwork, title and a line about it), and on the right a deep
 * indigo panel, in the site's violet and amber, that says what one payment
 * opens and carries the one button. On a phone the same two halves stack, the
 * panel becoming the lower sheet, so the button is always one thumb away.
 *
 * Everything it says is true: the figures come from the real library (and are
 * left out when too small to quote), the price is the cheapest real plan, and
 * there is no countdown, no scarcity and no promise about refunds or offers.
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
  /** The cheapest per-month USD price for this visitor's tier, e.g. "$1.17". */
  fromPrice: string;
  backHref: string;
  backLabel: string;
}

// The panel keeps the same deep indigo in every theme, so its white text always
// reads well; the amber is the site's own accent colour.
const PANEL_BACKGROUND =
  "linear-gradient(155deg, oklch(0.42 0.17 275) 0%, oklch(0.27 0.13 283) 100%)";
const PANEL_GLOW_AMBER = "oklch(0.78 0.16 75 / 0.3)";
const PANEL_GLOW_VIOLET = "oklch(0.62 0.21 290 / 0.55)";
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
  fromPrice,
  backHref,
  backLabel,
}: PremiumGateProps) {
  const { t } = useLocale();
  const titleId = useId();
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
        <div className="relative aspect-[16/7] w-full overflow-hidden md:aspect-auto md:min-h-60 md:flex-1">
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

        <div className="relative px-6 pt-10 pb-7 md:px-9 md:pt-11 md:pb-9">
          <div
            className="bg-card text-primary ring-border absolute start-6 -top-6 flex size-12 items-center justify-center rounded-2xl shadow-lg ring-1 md:start-9"
            aria-hidden="true"
          >
            <Lock className="size-5" />
          </div>
          <h1
            id={titleId}
            dir="ltr"
            className="text-2xl leading-tight font-semibold tracking-tight md:text-3xl"
          >
            {title}
          </h1>
          {supportTitle && (
            <p dir="auto" className="text-muted-foreground mt-1.5 text-left text-lg">
              {supportTitle}
            </p>
          )}
          {description && (
            <p
              dir="ltr"
              className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-relaxed"
            >
              {description}
            </p>
          )}
          {supportDescription && (
            <p
              dir="auto"
              className="text-muted-foreground mt-2 line-clamp-3 text-left text-sm leading-relaxed"
            >
              {supportDescription}
            </p>
          )}
        </div>
      </div>

      {/* The offer: what one payment opens, the price, the button. */}
      <div className="relative isolate flex min-w-0 flex-col justify-center gap-5 overflow-hidden p-6 text-white md:p-9">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20"
          style={{ background: PANEL_BACKGROUND }}
        />
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

        <div ref={ctaRef} className="flex flex-col gap-3 border-t border-white/15 pt-5">
          <p dir="auto" className="flex flex-wrap items-baseline gap-x-1.5 text-sm text-white/70">
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
            <Link href={ctaHref} dir="auto">
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
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 font-semibold shadow-lg shadow-black/25"
            >
              <Link href={ctaHref} dir="auto">
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
