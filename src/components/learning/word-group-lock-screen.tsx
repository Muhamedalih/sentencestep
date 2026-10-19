import { WordGroupLocked } from "@/components/learning/word-group-locked";
import { trackPaywallViewed } from "@/lib/analytics/paywall";
import { getFromMonthlyPrice } from "@/lib/billing/from-price";
import { getGatePay } from "@/lib/billing/gate-pay";
import type { SupportLocale } from "@/lib/i18n/locales";
import { getGateFigures } from "@/lib/stats/gate-figures";
import type { WordGroup } from "@/types/word-lists";

/**
 * What a visitor sees on a word list that is part of Premium, for each of the three pages that
 * can open one (practice, Learn and the word wall): the lock card (WordGroupLocked). Counts the
 * view in the same batch as the reads it needs, so it adds no wait.
 */
export async function WordGroupLockScreen({
  group,
  locale,
}: {
  group: Pick<WordGroup, "id" | "title" | "supportTitle" | "description" | "supportDescription">;
  locale: SupportLocale | null;
}) {
  const [fromPrice, figures, pay] = await Promise.all([
    getFromMonthlyPrice(),
    getGateFigures(locale),
    getGatePay(),
    trackPaywallViewed({ kind: "word_group", groupId: group.id }),
  ]);
  return (
    <WordGroupLocked
      title={group.title}
      supportTitle={group.supportTitle}
      description={group.description}
      supportDescription={group.supportDescription}
      fromPrice={fromPrice}
      pay={pay}
      figures={figures}
    />
  );
}
