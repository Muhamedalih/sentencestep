import { LockedPreview } from "@/components/learning/locked-preview";
import { WordGroupLocked } from "@/components/learning/word-group-locked";
import { trackPaywallViewed } from "@/lib/analytics/paywall";
import { getFromMonthlyPrice } from "@/lib/billing/from-price";
import type { SupportLocale } from "@/lib/i18n/locales";
import { getGateFigures } from "@/lib/stats/gate-figures";
import { fetchWordGroupPreview } from "@/lib/supabase/queries/locked-preview";
import type { WordGroup } from "@/types/word-lists";

/**
 * What a visitor sees on a word list that is part of Premium, for each of the three pages that
 * can open one (practice, Learn and the word wall): a short look at its first words with one
 * calm button (see LockedPreview), or — when those words can't be read — the full lock
 * (WordGroupLocked). Counts the view with the shape that was shown, in the same batch as the
 * reads it needs, so it adds no wait.
 */
export async function WordGroupLockScreen({
  group,
  locale,
}: {
  group: Pick<WordGroup, "id" | "title" | "supportTitle" | "description" | "supportDescription">;
  locale: SupportLocale | null;
}) {
  const preview = await fetchWordGroupPreview(group.id, locale ?? undefined);
  if (preview) {
    await trackPaywallViewed({ kind: "word_group", groupId: group.id, shape: "preview" });
    return (
      <LockedPreview
        kind="words"
        title={group.title}
        supportTitle={group.supportTitle}
        lines={preview.lines}
        ctaHref="/upgrade"
        backHref="/learn/word-lists"
      />
    );
  }

  const [fromPrice, figures] = await Promise.all([
    getFromMonthlyPrice(),
    getGateFigures(locale),
    trackPaywallViewed({ kind: "word_group", groupId: group.id, shape: "gate" }),
  ]);
  return (
    <WordGroupLocked
      title={group.title}
      supportTitle={group.supportTitle}
      description={group.description}
      supportDescription={group.supportDescription}
      fromPrice={fromPrice}
      figures={figures}
    />
  );
}
