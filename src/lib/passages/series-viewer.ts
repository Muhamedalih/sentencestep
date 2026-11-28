import { cache } from "react";

import { isAdmin } from "@/lib/admin/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { isLearnerViewOn } from "@/lib/hybrid/learner-view";
import { getLearnLanguage } from "@/lib/learn-language-server";
import { fetchSeriesSummaries } from "@/lib/passages/queries";
import type { PassageSummary } from "@/lib/passages/types";

/**
 * The series episodes this viewer is shown, as cards in episode order (permission passageSeries).
 * They are drafts for now, so only an admin has any: everyone else, an admin looking as a learner and
 * the German track get none. Never throws: a failed read gives none.
 */
export const viewerSeriesEpisodes = cache(async (): Promise<PassageSummary[]> => {
  try {
    const features = await getEffectiveFeatures();
    if (!features.rollouts.passageSeries) return [];
    const [admin, learnerView, language] = await Promise.all([
      isAdmin(),
      isLearnerViewOn(),
      getLearnLanguage(),
    ]);
    if (!admin || learnerView || language === "de") return [];
    return await fetchSeriesSummaries();
  } catch (error) {
    console.error("[series] viewerSeriesEpisodes failed", error);
    return [];
  }
});
