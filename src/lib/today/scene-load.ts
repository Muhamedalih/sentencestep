import { cookies } from "next/headers";

import { PASSAGE_EXAMS } from "@/data/passages/exams";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import type { EffectiveFeatures } from "@/lib/features/config";
import { TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import { getLocale } from "@/lib/i18n/get-locale";
import type { SupportLocale } from "@/lib/i18n/locales";
import { localizePassage } from "@/lib/passages/localize";
import { fetchPassage } from "@/lib/passages/queries";
import type { Passage } from "@/lib/passages/types";
import { loadScenePassageId } from "@/lib/today/load";
import { buildScene } from "@/lib/today/scene";
import type { Scene } from "@/lib/today/scene";

/** Who is asking, as Today's loaders need it. */
async function viewer(userId: string, features: EffectiveFeatures) {
  const [isPremium, admin, locale, cookieStore] = await Promise.all([
    hasPremiumAccess(),
    isAdmin(),
    getLocale(),
    cookies(),
  ]);
  return {
    userId,
    locale: locale as SupportLocale | null,
    timeZone: cookieStore.get(TIMEZONE_COOKIE)?.value,
    isPremium,
    admin,
    hybridOffers: features.rollouts.hybridOffers,
    passagesEnabled: features.passages.enabled,
  };
}

/**
 * Today's scene for this learner (permission dailyScene): the day's passage, in their support
 * language, and its scene. Null when the day is not a scene day or anything fails: the day's steps
 * are then the usual ones.
 */
export async function loadTodayScene(
  userId: string,
  features: EffectiveFeatures,
): Promise<{ passage: Passage; scene: Scene } | null> {
  if (!features.rollouts.dailyScene) return null;
  try {
    const who = await viewer(userId, features);
    const id = await loadScenePassageId(who);
    const fetched = id ? await fetchPassage(id) : null;
    if (!fetched) return null;
    const { passage } = localizePassage(fetched, PASSAGE_EXAMS[fetched.id], who.locale);
    const scene = buildScene(passage);
    return scene ? { passage, scene } : null;
  } catch (error) {
    console.error("[scene] loadTodayScene failed", error);
    return null;
  }
}

/**
 * Whether today's second step is the scene's lines for this learner, which is when a story they
 * finish must not tick it. A failed read counts as a scene day: a missed tick is better than a wrong
 * one.
 */
export async function hasSceneToday(userId: string, features: EffectiveFeatures): Promise<boolean> {
  if (!features.rollouts.dailyScene) return false;
  try {
    return (await loadScenePassageId(await viewer(userId, features))) !== null;
  } catch (error) {
    console.error("[scene] hasSceneToday failed", error);
    return true;
  }
}
