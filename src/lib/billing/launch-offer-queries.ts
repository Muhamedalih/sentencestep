import { cache } from "react";

import { parseLaunchOffer } from "@/lib/billing/launch-offer";
import type { LaunchOffer } from "@/lib/billing/launch-offer";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";

const POSTGRES_UNDEFINED_COLUMN = "42703";

/**
 * The stored launch offer, or null when there is none. It is read in its own
 * query, apart from getAccessSettings(), so that a deployment that runs before
 * the migrations adding the columns (or any read error) can only ever mean
 * "no offer" and can never touch the free-access switch every page depends on.
 * A deployment that runs before the per-plan migration (20250342…) still reads the
 * single number, which then applies to every plan — exactly the offer as it was.
 * Whether the offer is still running is decided by the caller with
 * isOfferActive() / bonusDaysForCheckout(), because that depends on the moment.
 * cache()'d per request like getAccessSettings().
 */
export const getLaunchOffer = cache(async (): Promise<LaunchOffer | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createPublicClient();
    const full = await supabase
      .from("access_settings")
      .select(
        "launch_offer_bonus_days, launch_offer_ends_on, launch_offer_bonus_days_3m, launch_offer_bonus_days_6m",
      )
      .eq("id", 1)
      .maybeSingle();
    if (full.error?.code === POSTGRES_UNDEFINED_COLUMN) {
      const single = await supabase
        .from("access_settings")
        .select("launch_offer_bonus_days, launch_offer_ends_on")
        .eq("id", 1)
        .maybeSingle();
      if (single.error || !single.data) return null;
      return parseLaunchOffer(single.data);
    }
    if (full.error || !full.data) return null;
    return parseLaunchOffer(full.data);
  } catch {
    return null;
  }
});
