"use server";

import { emptyHomeEngagement, loadHomeEngagement } from "@/lib/features/home-engagement";
import type { HomeEngagementData } from "@/lib/features/home-engagement";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { createClient } from "@/lib/supabase/server";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fallback for Home's engagement cards: the page normally renders them itself
 * (see startHomeEngagement), but only once the browser has told the server its
 * time zone (first visit) and only for the date the server derived from it
 * (a traveller whose zone just changed). In those cases the browser asks here
 * — ONE request that loads all three cards in parallel, not one queued
 * request per card. `todayISO` is the learner's own local date. Returns null
 * for an invalid date; everything else degrades to empty cards, never an
 * error: this is decoration on Home.
 */
export async function fetchHomeEngagementAction(
  todayISO: string,
): Promise<HomeEngagementData | null> {
  if (!ISO_DATE.test(todayISO)) return null;
  try {
    const features = await getEffectiveFeatures();
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) return emptyHomeEngagement(todayISO);
    return await loadHomeEngagement(userId, todayISO, features);
  } catch (error) {
    console.error("[home-engagement] fetchHomeEngagementAction failed", error);
    return null;
  }
}
