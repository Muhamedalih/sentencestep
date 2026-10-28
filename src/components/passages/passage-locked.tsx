"use client";

import { PremiumGate } from "@/components/learning/premium-gate";
import { PosterPicture } from "@/components/passages/poster-picture";
import { useLocale } from "@/components/providers/locale-provider";
import { posterArtFor } from "@/lib/passages/art";
import type { PassageTone } from "@/lib/passages/types";
import type { GateLean } from "@/lib/billing/gate-lean";
import type { GatePay } from "@/lib/billing/gate-pay";
import type { GateProgress } from "@/lib/progress/honest-numbers";
import type { GateFigures } from "@/lib/stats/content-stats";

/** The passage's own poster — its picture when an admin chose one (blurred out, as on the list), else its colour — and number, standing in for artwork. What is behind the lock is never sent to the viewer, so nothing here pretends to show it. */
export function PosterArt({
  tone,
  order,
  posterUrl,
}: {
  tone: PassageTone;
  order: number;
  posterUrl: string | null;
}) {
  const art = posterArtFor(tone, order);
  return (
    <div
      aria-hidden="true"
      className="relative flex h-full w-full items-end overflow-hidden p-6"
      style={{ backgroundImage: art.backgroundImage }}
    >
      <PosterPicture src={posterUrl} blurred />
      <span className="relative text-6xl leading-none font-semibold text-white/30 tabular-nums">
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
  passageId,
  tone,
  order,
  posterUrl,
  title,
  titleAr,
  summary,
  summaryAr,
  fromPrice,
  pay,
  progress,
  figures,
  lean,
}: {
  /** This passage's id: the plans page is opened with its address, so after paying the learner goes straight back to it. */
  passageId: string;
  tone: PassageTone;
  order: number;
  /** The passage's own picture, when an admin chose one (see PassageSummary.posterUrl). */
  posterUrl: string | null;
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  /** The cheapest per-month USD price for this visitor's tier, e.g. "$1.17" — see getFromMonthlyPrice. */
  fromPrice: string;
  /** The running offer (see getGatePay). */
  pay: GatePay;
  /** What this learner has done so far (see getGateProgress): shown as one strip on the card. */
  progress?: GateProgress | null;
  /** How big the library really is (see getGateFigures); a null figure is simply left out of the sentence. */
  figures: GateFigures;
  /** The lean card's extras when the "leanGate" permission is open for this visitor (see getGateLean). */
  lean?: GateLean | null;
}) {
  const { t, locale } = useLocale();
  const arabic = locale === "ar";

  return (
    <PremiumGate
      preview={<PosterArt tone={tone} order={order} posterUrl={posterUrl} />}
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
      ctaHref={`/upgrade?next=${encodeURIComponent(`/learn/passages/${passageId}`)}`}
      fromPrice={fromPrice}
      pay={pay}
      progress={progress}
      lean={lean}
      lockKind="passage"
      backHref="/learn/passages"
      backLabel={t.passages.backToAll}
    />
  );
}
