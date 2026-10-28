"use server";

import { cookies } from "next/headers";

import { track } from "@/lib/analytics/track";
import { hasPremiumAccess } from "@/lib/billing/access";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

import { HYBRID_MOMENTS, momentBlock } from "./moments";
import type { HybridMoment } from "./moments";

/** How far back the moments look at what was shown and dismissed: the two-dismissal pause needs two weeks. */
const HISTORY_MS = 14 * 24 * 60 * 60 * 1000;

function isMoment(value: unknown): value is HybridMoment {
  return typeof value === "string" && (HYBRID_MOMENTS as readonly string[]).includes(value);
}

/**
 * Whether a moment may be shown to the signed-in learner now and, if so, records that it was shown
 * (OFFER_SHOWN), which is what the one-a-day rule counts. Anything that cannot be read answers no:
 * a card is never shown on a guess. The rules themselves are in moments.ts.
 */
export async function claimHybridMoment(moment: HybridMoment): Promise<boolean> {
  if (!isMoment(moment)) return false;
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    const [features, premium, cookieStore] = await Promise.all([
      getEffectiveFeatures(),
      hasPremiumAccess(),
      cookies(),
    ]);
    if (!features.rollouts.hybridOffers) return false;

    const timeZone = cookieStore.get(TIMEZONE_COOKIE)?.value;
    const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
    const now = Date.now();
    const supabase = createServiceRoleClient();
    const since = new Date(now - HISTORY_MS).toISOString();
    const [profile, history, orders] = await Promise.all([
      supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
      supabase
        .from("analytics_events")
        .select("event_name, created_at")
        .eq("user_id", user.id)
        .in("event_name", ["OFFER_SHOWN", "OFFER_DISMISSED"])
        .gte("created_at", since),
      supabase
        .from("payment_orders")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["created", "pending"])
        .limit(1),
    ]);
    if (profile.error || history.error || orders.error) return false;

    const created = profile.data ? Date.parse(profile.data.created_at) : Number.NaN;
    const rows = history.data ?? [];
    const block = momentBlock({
      now,
      accountCreatedAt: Number.isFinite(created) ? created : null,
      isSubscriber: premium,
      hasOpenOrder: (orders.data ?? []).length > 0,
      shownToday: rows.some(
        (row) =>
          row.event_name === "OFFER_SHOWN" &&
          localISODateInTimeZone(timeZone, new Date(row.created_at)) === todayISO,
      ),
      dismissals: rows
        .filter((row) => row.event_name === "OFFER_DISMISSED")
        .map((row) => Date.parse(row.created_at)),
    });
    if (block) return false;

    await track({ name: "OFFER_SHOWN", category: "PREMIUM", properties: { moment } }, user.id);
    return true;
  } catch (error) {
    console.error("[hybrid] could not decide a moment", error);
    return false;
  }
}

/** Records what the learner did with a moment they were shown: tapped its button, or closed it. */
export async function trackHybridOffer(
  moment: HybridMoment,
  action: "clicked" | "dismissed",
): Promise<void> {
  if (!isMoment(moment)) return;
  const user = await getCurrentUser();
  if (!user) return;
  const name = action === "clicked" ? "OFFER_CLICKED" : "OFFER_DISMISSED";
  await track({ name, category: "PREMIUM", properties: { moment } }, user.id);
}
