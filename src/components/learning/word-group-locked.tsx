"use client";

import { PremiumGate } from "@/components/learning/premium-gate";
import { useLocale } from "@/components/providers/locale-provider";
import type { GateFigures } from "@/lib/stats/content-stats";

/**
 * A word list's artwork stand-in: a word list has no illustration, so the
 * brand's lavender and amber glow sits behind a small stack of blank word
 * cards. Purely decorative: what is on a locked card is never sent to the
 * viewer, so nothing here pretends to show it.
 */
function WordCardsArt() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(70% 90% at 12% 15%, color-mix(in oklch, var(--brand) 26%, transparent), transparent 70%), radial-gradient(75% 95% at 92% 95%, color-mix(in oklch, var(--accent) 48%, transparent), transparent 70%), var(--brand-muted)",
      }}
    >
      <div className="relative h-28 w-48 md:h-36 md:w-56">
        {[
          { rotate: "-9deg", x: "-22%", opacity: 0.55 },
          { rotate: "7deg", x: "20%", opacity: 0.75 },
          { rotate: "-1deg", x: "0%", opacity: 1 },
        ].map((card) => (
          <div
            key={card.rotate}
            className="border-foreground/10 bg-card absolute inset-0 flex flex-col justify-center gap-2.5 rounded-2xl border px-5 shadow-lg"
            style={{
              transform: `translateX(${card.x}) rotate(${card.rotate})`,
              opacity: card.opacity,
            }}
          >
            <span className="bg-primary/70 h-3 w-16 rounded-full" />
            <span className="bg-foreground/10 h-2 w-full rounded-full" />
            <span className="bg-foreground/10 h-2 w-4/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Word Lists' own locked-group state — not a reuse of PremiumLocked, which
 * is typed to a LearningMode ("Back to lessons" → /learn/{mode}) that Word
 * Lists isn't one of. It is the same card (PremiumGate) with its own artwork,
 * words and way back.
 */
export function WordGroupLocked({
  title,
  supportTitle,
  description,
  supportDescription,
  fromPrice,
  figures,
}: {
  title: string;
  /** Never falls back to the Arabic column for Spanish — see types/content.ts's Sentence.supportText doc comment for the same rule applied everywhere else. */
  supportTitle?: string;
  description?: string;
  supportDescription?: string;
  /** The cheapest per-month USD price for this visitor's tier, e.g. "$1.17" — see getFromMonthlyPrice. */
  fromPrice: string;
  /** How big the library really is (see getGateFigures); a null figure is simply left out of the sentence. */
  figures: GateFigures;
}) {
  const { t } = useLocale();

  return (
    <PremiumGate
      preview={<WordCardsArt />}
      badge={t.wordLists.lockedBadge}
      title={title}
      supportTitle={supportTitle}
      description={description}
      supportDescription={supportDescription}
      heading={t.wordLists.gateHeading}
      subheading={t.wordLists.gateSubheading}
      benefits={[
        figures.wordLists && figures.words
          ? t.wordLists.gateBenefitLists
              .replace("{lists}", figures.wordLists)
              .replace("{words}", figures.words)
          : t.wordLists.gateBenefitListsPlain,
        t.wordLists.gateBenefitContext,
        t.wordLists.gateBenefitReview,
      ]}
      ctaHref="/upgrade"
      fromPrice={fromPrice}
      backHref="/learn/word-lists"
      backLabel={t.wordLists.backToWordLists}
    />
  );
}
