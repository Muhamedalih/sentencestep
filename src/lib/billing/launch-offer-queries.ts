import { cache } from "react";

import { parseLaunchOffer } from "@/lib/billing/launch-offer";
import type { LaunchOffer } from "@/lib/billing/launch-offer";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";

/**
 * The stored launch offer, or null when there is none. It is read in its own
 * query, apart from getAccessSettings(), so that a deployment that runs before
 * the migration adding the two columns (or any read error) can only ever mean
 * "no offer" and can never touch the free-access switch every page depends on.
 * Whether the offer is still running is decided by the caller with
 * isOfferActive() / bonusDaysForCheckout(), because that depends on the moment.
 * cache()'d per request like getAccessSettings().
 */
export const getLaunchOffer = cache(async (): Promise<LaunchOffer | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await createPublicClient()
      .from("access_settings")
      .select("launch_offer_bonus_days, launch_offer_ends_on")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return null;
    return parseLaunchOffer(data);
  } catch {
    return null;
  }
});
