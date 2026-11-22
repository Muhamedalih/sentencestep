import { cookies } from "next/headers";

import { cache } from "react";

import { isAdmin } from "@/lib/admin/access";
import { isLearnerViewOn } from "@/lib/hybrid/learner-view";
import { LEARN_LANGUAGE_COOKIE, type TargetLanguage } from "@/lib/learn-language";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * The language this request learns (permission germanTrack, Admins only for now). German only when
 * an admin chose it on this browser and is not looking at the site as a learner; every other visitor
 * gets English, whatever the cookie says, so the cookie can never open anything.
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
  if (!(await isAdmin())) return "en";
  if (await isLearnerViewOn()) return "en";
  const value = (await cookies()).get(LEARN_LANGUAGE_COOKIE)?.value;
  // "en" is stored as a cookie too, so only a browser that never chose asks the account.
  return value === "de" || value === "en" ? value : readProfileLanguage();
});
