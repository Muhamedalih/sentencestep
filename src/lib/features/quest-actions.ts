"use server";

import { getEffectiveFeatures } from "@/lib/features/queries";
import { dealDailyQuests } from "@/lib/features/quest-service";
import { allQuestsCompleted } from "@/lib/features/quests";
import type { DailyQuest } from "@/lib/features/quests";
import { createClient } from "@/lib/supabase/server";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface DailyQuestsPayload {
  quests: DailyQuest[];
  allDone: boolean;
}

/**
 * Today's quests for the signed-in learner (dealing them on first call of the
 * day). `todayISO` is the learner's own local calendar date, supplied by the
 * client for the usual reason (a Server Action runs in the server's time
 * zone). Returns null — rendering nothing — when quests aren't open to this
 * visitor or anything fails: it is decoration on Home and must never surface
 * an error there.
 */
export async function fetchDailyQuestsAction(todayISO: string): Promise<DailyQuestsPayload | null> {
  if (!ISO_DATE.test(todayISO)) return null;
  try {
    const features = await getEffectiveFeatures();
    if (!features.quests.enabled) return null;

    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) return null;

    const quests = await dealDailyQuests(userId, todayISO, features);
    if (quests.length === 0) return null;
    return { quests, allDone: allQuestsCompleted(quests) };
  } catch (error) {
    console.error("[quests] fetchDailyQuestsAction failed", error);
    return null;
  }
}
