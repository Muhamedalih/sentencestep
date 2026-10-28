"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { Gift, LockOpen, Star } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { giftPill } from "@/lib/billing/gate-lean";
import type { GateLean } from "@/lib/billing/gate-lean";
import type { GatePay } from "@/lib/billing/gate-pay";
import { formatDayCount } from "@/lib/i18n/format-days";
import type { GateProgress } from "@/lib/progress/honest-numbers";

// The same indigo panel as the long card, with its two glows taken away: what is left is one calm
// colour, a lavender for the small labels, and the green the running offer already uses.
const LAVENDER = "oklch(0.82 0.09 285)";
const GREEN = "oklch(0.88 0.14 152)";
const GREEN_BORDER = "oklch(0.8 0.17 150 / 0.45)";
const GREEN_FILL = "oklch(0.8 0.17 150 / 0.14)";
export const LEAN_BUTTON_CLASS =
  "bg-white text-[oklch(0.3_0.12_283)] hover:bg-white/90 font-medium shadow-lg shadow-black/25";

/**
 * The offer half of the lock card when the "leanGate" permission is open (see PremiumGate): only what
 * decides a purchase. A heading and one line, the sealed-section card when that section really opens
 * for subscribers, one small price with its reassurance and the gift-days mark, one button, one line
 * of real proof, the way back. Every line is a plain string from the dictionary or a real figure.
 */
export function LeanOffer({
  heading,
  ctaHref,
  fromPrice,
  pay,
  progress,
  lean,
  backHref,
  backLabel,
  ctaRef,
}: {
  heading: string;
  ctaHref: string;
  fromPrice: string;
  pay: GatePay;
  progress?: GateProgress | null;
  lean: GateLean;
  backHref: string;
  backLabel: string;
  ctaRef: RefObject<HTMLDivElement | null>;
}) {
  const { t, locale } = useLocale();
  // "Plans from {amount} / month": the amount is set large, wherever the language puts it.
  const [priceBefore = "", priceAfter = ""] = t.premium.fromPerMonthCaption.split("{amount}");
  const pill = giftPill(pay);
  const pillText = pill
    ? (pill.upTo ? t.premium.gateGiftUpTo : t.premium.launchOfferChip).replace(
        "{days}",
        formatDayCount(t.premium, locale, pill.days),
      )
    : null;
  const learners = lean.learners
    ? t.premium.socialProofLearners.replace("{count}", lean.learners)
    : null;
  const progressNotes = [
    progress?.days != null
      ? t.premium.gateProgressDays.replace("{days}", String(progress.days))
      : null,
    progress?.reviewFree ? t.premium.gateReviewFree : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {progress && (
        <div className="flex items-center gap-3 border-b border-white/15 pb-4">
          <span dir="ltr" className="text-4xl leading-none font-medium tabular-nums">
            {progress.sentences}
          </span>
          <div dir="auto" className="text-xs leading-normal text-white/75">
            <p className="text-[13px] text-white">{t.premium.gateProgressSentences}</p>
            {progressNotes && <p>{progressNotes}</p>}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <h2
          dir="auto"
          className="text-[1.3rem] leading-snug font-medium tracking-tight text-balance md:text-[1.4rem]"
        >
          {heading}
        </h2>
        <p dir="auto" className="text-sm leading-relaxed text-pretty text-white/78">
          {t.premium.gateLeanSubheading}
        </p>
      </div>

      {lean.gift && (
        <div
          dir="auto"
          className="flex flex-col gap-1 rounded-xl border border-dashed border-white/40 bg-white/[0.08] px-3.5 py-3"
        >
          <p className="flex items-center gap-1.5 text-xs" style={{ color: LAVENDER }}>
            <Gift className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{t.premium.gateGiftTag}</span>
          </p>
          <p className="text-base leading-snug font-medium text-white">{t.premium.gateGiftTitle}</p>
          <p className="text-[12.5px] leading-relaxed text-white/80">{t.premium.gateGiftBody}</p>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-white/15 pt-4">
        <p dir="auto" className="flex flex-wrap items-baseline gap-x-1.5 text-sm text-white/75">
          {priceBefore.trim() && <span>{priceBefore.trim()}</span>}
          <span dir="ltr" className="text-4xl leading-tight font-medium tracking-tight text-white">
            {fromPrice}
          </span>
          {priceAfter.trim() && <span>{priceAfter.trim()}</span>}
        </p>
        <div dir="auto" className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="text-xs text-white/75">{t.premium.gateTrustShort}</span>
          {pillText && (
            <span
              className="rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap"
              style={{ color: GREEN, borderColor: GREEN_BORDER, backgroundColor: GREEN_FILL }}
            >
              {pillText}
            </span>
          )}
        </div>
      </div>

      <div ref={ctaRef}>
        <Button asChild size="lg" className={`h-12 w-full text-base ${LEAN_BUTTON_CLASS}`}>
          <Link href={ctaHref} dir="auto">
            <LockOpen aria-hidden="true" />
            {lean.gift ? t.premium.gateLeanCtaGift : t.premium.gateCta}
          </Link>
        </Button>
      </div>

      {!progress && (lean.rating || learners) && (
        <p
          dir="auto"
          className="flex flex-wrap items-center justify-center gap-x-1.5 text-xs text-white/75"
        >
          {lean.rating && (
            <>
              <Star className="size-3.5" aria-hidden="true" />
              <bdi dir="ltr">{lean.rating}</bdi>
            </>
          )}
          {lean.rating && learners && <span aria-hidden="true">·</span>}
          {learners && <span>{learners}</span>}
        </p>
      )}

      <Link
        href={backHref}
        dir="auto"
        className="min-h-11 self-center rounded-md px-3 py-2 text-sm text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        {backLabel}
      </Link>
    </>
  );
}
