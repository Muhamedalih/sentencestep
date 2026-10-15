"use client";

import { PremiumGate } from "@/components/learning/premium-gate";
import { useLocale } from "@/components/providers/locale-provider";
import { posterArtFor } from "@/lib/passages/art";
import type { PassageTone } from "@/lib/passages/types";
import type { GateFigures } from "@/lib/stats/content-stats";

/** The passage's own poster — its colour and number, as on the list — standing in for artwork. What is behind the lock is never sent to the viewer, so nothing here pretends to show it. */
function PosterArt({ tone, order }: { tone: PassageTone; order: number }) {
  const art = posterArtFor(tone, order);
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-end p-6"
      style={{ backgroundImage: art.backgroundImage }}
    >
      <span className="text-6xl leading-none font-semibold text-white/30 tabular-nums">
        {String(order).padStart(2, "0")}
      </span>
    </div>
  );
}

/**
 * What a free learner (or a visitor) sees on a Premium passage: the same card as a
 * locked lesson or word list (see PremiumGate), with the passage's poster and its
 * one-line hook — never a spoiler — beside the offer.
 */
export function PassageLocked({
  tone,
  order,
  title,
  titleAr,
  summary,
  summaryAr,
  fromPrice,
  figures,
}: {
  tone: PassageTone;
  order: number;
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  /** The cheapest per-month USD price for this visitor's tier, e.g. "$1.17" — see getFromMonthlyPrice. */
  fromPrice: string;
  /** How big the library really is (see getGateFigures); a null figure is simply left out of the sentence. */
  figures: GateFigures;
}) {
  const { t, locale } = useLocale();
  const arabic = locale === "ar";

  return (
    <PremiumGate
      preview={<PosterArt tone={tone} order={order} />}
      badge={t.passages.lockedBadge}
      title={title}
      supportTitle={arabic ? titleAr : undefined}
      description={summary}
      supportDescription={arabic ? summaryAr : undefined}
      heading={t.passages.gateHeading}
      subheading={t.premium.gateSubheading}
      benefits={[
        figures.lessons
          ? t.premium.gateBenefitLibrary.replace("{count}", figures.lessons)
          : t.premium.gateBenefitLibraryPlain,
        t.premium.gateBenefitMethod,
        t.premium.gateBenefitProgress,
      ]}
      ctaHref="/upgrade"
      fromPrice={fromPrice}
      backHref="/learn/passages"
      backLabel={t.passages.backToAll}
    />
  );
}
