import { cookies } from "next/headers";

import { isAdmin } from "@/lib/admin/access";
import { isLearnerViewOn } from "@/lib/hybrid/learner-view";
import { LEARN_LANGUAGE_COOKIE, type TargetLanguage } from "@/lib/learn-language";

/**
 * The language this request learns (permission germanTrack, Admins only for now). German only when
 * an admin chose it on this browser and is not looking at the site as a learner; every other visitor
 * gets English, whatever the cookie says, so the cookie can never open anything.
 */
export async function getLearnLanguage(): Promise<TargetLanguage> {
  const value = (await cookies()).get(LEARN_LANGUAGE_COOKIE)?.value;
  if (value !== "de") return "en";
  if (!(await isAdmin())) return "en";
  if (await isLearnerViewOn()) return "en";
  return "de";
}
