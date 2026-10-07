"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { validateLaunchOfferInput } from "@/lib/billing/launch-offer";
import type { LaunchOfferInput } from "@/lib/billing/launch-offer";
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
 * Sets or clears the launch offer (bonus days on every purchase until a date),
 * validated by validateLaunchOfferInput. Zero bonus days clears it. Nothing
 * else is touched, and the offer only ever takes effect in server-side checkout
 * code when an order is created (see startCheckout).
 */
export async function setLaunchOffer(input: LaunchOfferInput): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateLaunchOfferInput(input, new Date());
  if (!validation.ok) return { error: validation.error };

  const values = validation.clear
    ? { launch_offer_bonus_days: 0, launch_offer_ends_on: null }
    : {
        launch_offer_bonus_days: validation.offer.bonusDays,
        launch_offer_ends_on: validation.offer.endsOn,
      };

  const supabase = await createClient();
  const { error } = await supabase
    .from("access_settings")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", 1);

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
      : { bonusDays: validation.offer.bonusDays, endsOn: validation.offer.endsOn },
  );
  revalidatePath("/admin/free-access");
  revalidatePath("/upgrade");
  return {
    success: validation.clear
      ? "Launch offer removed."
      : `Launch offer saved: ${validation.offer.bonusDays} bonus days on every purchase through ${validation.offer.endsOn}.`,
  };
}
