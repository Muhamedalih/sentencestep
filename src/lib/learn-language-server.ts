import { cookies } from "next/headers";

import { cache } from "react";

import { isAdmin } from "@/lib/admin/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { isLearnerViewOn } from "@/lib/hybrid/learner-view";
import { LEARN_LANGUAGE_COOKIE, type TargetLanguage } from "@/lib/learn-language";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * Whether German is open to this visitor: an admin always, everyone else once the germanTrack
 * permission is opened to them on the Permissions page (closed by default). Every German door asks
 * this one question, so closing the permission closes them all at once.
 */
export const isGermanOpen = cache(async (): Promise<boolean> => {
  if (await isAdmin()) return true;
  try {
    return (await getEffectiveFeatures()).rollouts.germanTrack;
  } catch {
    return false;
  }
});

/**
 * Whether the German beginner features (permission germanZero: the fourth level, the letters lesson,
 * the skip button on the German opening lesson) are open to this visitor: German must be open too, then
 * an admin always, everyone else once germanZero is opened.
 */
export const isGermanZeroOpen = cache(async (): Promise<boolean> => {
  if (!(await isGermanOpen())) return false;
  if (await isAdmin()) return true;
  try {
    return (await getEffectiveFeatures()).rollouts.germanZero;
  } catch {
    return false;
  }
});

/**
 * The language this request learns (permission germanTrack). German only when German is open to this
 * visitor, they chose it on this browser and an admin is not looking at the site as a learner; anyone
 * else gets English, whatever the cookie says, so the cookie can never open anything.
 */
/** The choice kept on the account, for a browser that has none yet (another device). A failed read is English. */
const readProfileLanguage = cache(async (): Promise<TargetLanguage> => {
  try {
    const user = await getCurrentUser();
    if (!user) return "en";
    const { data } = await (
      await createClient()
    )
      .from("profiles")
      .select("target_language")
      .eq("id", user.id)
      .maybeSingle();
    return data?.target_language === "de" ? "de" : "en";
  } catch {
    return "en";
  }
});

export const getLearnLanguage = cache(async (): Promise<TargetLanguage> => {
  if (!(await isGermanOpen())) return "en";
  if (await isLearnerViewOn()) return "en";
  const value = (await cookies()).get(LEARN_LANGUAGE_COOKIE)?.value;
  // "en" is stored as a cookie too, so only a browser that never chose asks the account.
  return value === "de" || value === "en" ? value : readProfileLanguage();
});
