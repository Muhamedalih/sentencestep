"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import {
  offerBonusDaysByPlan,
  sharedBonusDays,
  validateLaunchOfferInput,
} from "@/lib/billing/launch-offer";
import type { LaunchOffer, LaunchOfferInput } from "@/lib/billing/launch-offer";
import { createClient } from "@/lib/supabase/server";

/**
 * The single admin control for the sitewide "everything is free" promotion
 * (see 20250228000000_free_for_all_access.sql and access-settings-queries.ts).
 * Flipping this is the entire on/off switch — no subscriptions row is ever
 * touched, so turning it back off restores every learner's real plan
 * exactly as getAccessState() would have computed it without this feature.
 */
export async function setFreeForAll(enabled: boolean): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("access_settings")
    .update({ free_for_all: enabled, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { error: "Couldn't save that. Please try again." };

  void logAdminAction("access_settings.free_for_all_updated", "access_settings", null, {
    enabled,
  });
  revalidatePath("/admin/free-access");
  // "layout" (not the default "page") so this busts every /learn/* route's
  // client Router Cache entry too — /learn/normal, /learn/stories,
  // /learn/conversation, etc. — not just the literal "/learn" path. With
  // next.config.ts's experimental.staleTimes.dynamic now caching a visitor's
  // already-loaded lesson list client-side for up to 30s, flipping this
  // switch off must invalidate that cache immediately everywhere premium
  // content could be showing, not just on the next unrelated revalidation.
  revalidatePath("/learn", "layout");
  revalidatePath("/upgrade");
  return {
    success: enabled
      ? "Everything is free — subscriptions are suspended."
      : "Subscriptions restored — premium content is locked again.",
  };
}

const POSTGRES_UNDEFINED_COLUMN = "42703";

/**
 * Sets or clears the launch offer (bonus days on a purchase until a date, the same for every
 * plan or a different number for each), validated by validateLaunchOfferInput. Zero bonus days
 * on the one-month plan clears it. Nothing else is touched, and the offer only ever takes effect
 * in server-side checkout code when an order is created (see startCheckout).
 */
export async function setLaunchOffer(input: LaunchOfferInput): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateLaunchOfferInput(input, new Date());
  if (!validation.ok) return { error: validation.error };

  const planBonusDays = validation.clear ? undefined : validation.offer.planBonusDays;
  const base = validation.clear
    ? { launch_offer_bonus_days: 0, launch_offer_ends_on: null }
    : {
        launch_offer_bonus_days: validation.offer.bonusDays,
        launch_offer_ends_on: validation.offer.endsOn,
      };
  // Always written, so saving a new offer (or removing it) also clears numbers an earlier one had.
  const perPlan = {
    launch_offer_bonus_days_3m: planBonusDays?.["3m"] ?? null,
    launch_offer_bonus_days_6m: planBonusDays?.["6m"] ?? null,
  };

  const supabase = await createClient();
  const stamp = { updated_at: new Date().toISOString() };
  let { error } = await supabase
    .from("access_settings")
    .update({ ...base, ...perPlan, ...stamp })
    .eq("id", 1);
  // An offer with one number for every plan doesn't need the per-plan columns, so it still saves
  // on a database that hasn't had the latest migration yet.
  if (error?.code === POSTGRES_UNDEFINED_COLUMN && !planBonusDays) {
    ({ error } = await supabase
      .from("access_settings")
      .update({ ...base, ...stamp })
      .eq("id", 1));
  }

  if (error) {
    return {
      error:
        error.code === POSTGRES_UNDEFINED_COLUMN
          ? "The launch-offer columns don't exist yet — run the latest database migration first."
          : "Couldn't save that. Please try again.",
    };
  }

  void logAdminAction(
    "access_settings.launch_offer_updated",
    "access_settings",
    null,
    validation.clear
      ? { cleared: true }
      : {
          bonusDays: validation.offer.bonusDays,
          ...(planBonusDays ? { planBonusDays } : {}),
          endsOn: validation.offer.endsOn,
        },
  );
  revalidatePath("/admin/free-access");
  revalidatePath("/upgrade");
  return {
    success: validation.clear
      ? "Launch offer removed."
      : `Launch offer saved: ${describeBonusDays(validation.offer)} through ${validation.offer.endsOn}.`,
  };
}

/** "7 bonus days on every purchase", or the number for each plan when they differ. */
function describeBonusDays(offer: LaunchOffer): string {
  const shared = sharedBonusDays(offer);
  if (shared !== null) return `${shared} bonus days on every purchase`;
  const byPlan = offerBonusDaysByPlan(offer);
  return `${byPlan["1m"]} bonus days on the 1-month plan, ${byPlan["3m"]} on the 3-month plan, ${byPlan["6m"]} on the 6-month plan`;
}
