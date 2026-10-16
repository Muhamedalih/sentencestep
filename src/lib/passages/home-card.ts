import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import type { EffectiveFeatures } from "@/lib/features/config";
import { openablePassages } from "@/lib/passages/access";
import { fetchPassageProgress, fetchPassageSummaries } from "@/lib/passages/queries";
import { homeCardPick } from "@/lib/passages/progress";
import type { PassageLevel, PassageTone } from "@/lib/passages/types";

/**
 * What Home's Passages card shows: the one passage to point at — the one the
 * learner started and has not finished, else the first they have not started —
 * and how far they are in it. Like every Home engagement card it is decoration
 * on Home: it returns null (the card is simply not drawn) when Passages is not
 * open to this visitor, when there is nothing left to suggest, or when anything
 * at all goes wrong, and it never throws.
 *
 * It costs Home almost nothing: the passage list is the same share-cached read
 * the Passages page uses, and the learner's progress is one query for their own
 * rows. Both start alongside the page's other reads (see startHomeEngagement) and
 * the card streams in by itself, so it can never hold the page back.
 */

export interface PassagesHomeData {
  mode: "continue" | "next";
  passage: {
    id: string;
    order: number;
    level: PassageLevel;
    tone: PassageTone;
    title: string;
    titleAr: string;
    summary: string;
    summaryAr: string;
    minutes: number;
    sectionCount: number;
    /** The passage's own picture, when an admin chose one (see PassageSummary.posterUrl). */
    posterUrl: string | null;
  };
  /** Parts already finished (0 when the passage has not been started). */
  sectionsDone: number;
}

export async function loadPassagesHomeCard(
  userId: string,
  features: EffectiveFeatures,
): Promise<PassagesHomeData | null> {
  if (!features.passages.enabled) return null;
  try {
    const [summaries, progress] = await Promise.all([
      fetchPassageSummaries(),
      fetchPassageProgress(userId),
    ]);
    // Home never points a free learner at a Premium passage they can't open. Who can is only
    // looked up when some passage is Premium, so Home pays nothing while every one is free.
    const canOpenPremium =
      !summaries.some((summary) => !summary.isFree) ||
      (await Promise.all([hasPremiumAccess(), isAdmin()])).some(Boolean);
    const pick = homeCardPick(
      openablePassages(summaries, canOpenPremium),
      new Map(progress.map((entry) => [entry.passageId, entry])),
    );
    if (!pick) return null;
    const { passage } = pick;
    return {
      mode: pick.mode,
      sectionsDone: pick.sectionsDone,
      passage: {
        id: passage.id,
        order: passage.order,
        level: passage.level,
        tone: passage.tone,
        title: passage.title,
        titleAr: passage.titleAr,
        summary: passage.summary,
        summaryAr: passage.summaryAr,
        minutes: passage.estimatedMinutes,
        sectionCount: passage.sectionCount,
        posterUrl: passage.posterUrl,
      },
    };
  } catch (error) {
    console.error("[passages] loadPassagesHomeCard failed", error);
    return null;
  }
}
