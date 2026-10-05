import { cookies } from "next/headers";

import { getEffectiveFeatures } from "@/lib/features/queries";
import { localISODateInTimeZone, TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * What the CURRENT visitor gets of "Smart word practice" (the admin-controlled
 * feature, see FEATURE_IDS in src/lib/features/config.ts) — resolved once per
 * request and handed to the Word Lists pages and actions. Server-only: it reads
 * cookies and the session.
 *
 *  - enabled: the practice upgrades are open to this visitor (type-ahead, hint,
 *    "I don't know", alternates, audio after the attempt, listen-and-type).
 *  - spaced: the part that stores something per learner (strength, due reviews,
 *    Continue) — needs a signed-in account, so `userId` is set exactly then.
 *
 * Rolling the feature out is one switch in /admin/features; nothing here (or in
 * any caller) needs to change, because every check goes through the same
 * resolved flags (admin preview -> everyone is just the state going from
 * "admin" to "on").
 */
export interface SmartWordsAccess {
  enabled: boolean;
  spaced: boolean;
  userId: string | null;
}

export async function getSmartWordsAccess(): Promise<SmartWordsAccess> {
  const features = await getEffectiveFeatures();
  if (!features.smartWords.enabled) return { enabled: false, spaced: false, userId: null };
  if (!features.smartWords.spaced) return { enabled: true, spaced: false, userId: null };
  const user = await getCurrentUser();
  return { enabled: true, spaced: user !== null, userId: user?.id ?? null };
}

/**
 * The learner's own calendar date ("YYYY-MM-DD"), from the time zone the
 * browser left in a cookie (see TimezoneCookie and localISODateInTimeZone), so
 * "due tomorrow" means tomorrow morning where the learner is. A visitor with no
 * cookie yet (a first visit) gets the server's UTC date — off by at most a day
 * for one visit, never a crash.
 */
export async function getLearnerToday(): Promise<string> {
  const cookieStore = await cookies();
  return (
    localISODateInTimeZone(cookieStore.get(TIMEZONE_COOKIE)?.value) ??
    new Date().toISOString().slice(0, 10)
  );
}

/**
 * Whether the redesigned Word Lists screens are open to the CURRENT visitor
 * (the admin-controlled "Word Lists redesign" feature, see FEATURE_IDS in
 * src/lib/features/config.ts). Off -> nobody, Admin preview -> admins only on
 * the live site, On -> everyone: publishing it is that one switch in
 * /admin/features, and no caller changes, because every redesigned page and
 * screen asks through this one flag. Independent of Smart word practice: the
 * redesign shows the learner's schedule when getSmartWordsAccess provides one
 * and local progress otherwise.
 */
export async function getWordsRedesignEnabled(): Promise<boolean> {
  const features = await getEffectiveFeatures();
  return features.wordsRedesign.enabled;
}
