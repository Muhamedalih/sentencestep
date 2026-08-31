import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deriveAccessState } from "@/lib/billing/domain";
import { FREE_ACCESS } from "@/lib/billing/types";
import type { AccessState, Plan } from "@/lib/billing/types";

/** Name shared with dev-actions.ts, which is the only thing that ever writes this cookie. */
export const DEV_PLAN_COOKIE = "sentencestep-dev-plan";

const PREMIUM_DEV_ACCESS: AccessState = {
  plan: "premium",
  status: "active",
  expiresAt: null,
  cancelAtPeriodEnd: false,
  isPremium: true,
};

/**
 * A local-only override so free vs. premium can be exercised without a real
 * payment provider or even a linked Supabase project — see
 * src/lib/billing/dev-actions.ts for how it's set. Hard-gated to
 * non-production so a stray cookie can never grant access on a real
 * deployment: this check runs on every read, not just at write time.
 */
async function getDevPlanOverride(): Promise<Plan | null> {
  if (process.env.NODE_ENV === "production") return null;
  const cookieStore = await cookies();
  const value = cookieStore.get(DEV_PLAN_COOKIE)?.value;
  return value === "premium" ? "premium" : null;
}

/**
 * The app's single question — "does this user have premium access right
 * now?" — so every gate (lesson pages, content queries, UI) goes through
 * one place. A future payment provider only ever needs to change this file
 * (fetching the row) — the actual decision lives in the pure, unit-tested
 * deriveAccessState in domain.ts.
 */
export async function getAccessState(): Promise<AccessState> {
  const devOverride = await getDevPlanOverride();
  if (devOverride === "premium") return PREMIUM_DEV_ACCESS;

  if (!isSupabaseConfigured()) return FREE_ACCESS;

  const user = await getCurrentUser();
  if (!user) return FREE_ACCESS;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return deriveAccessState(
    data && {
      plan: data.plan,
      status: data.status,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      providerCustomerId: data.provider_customer_id,
      providerSubscriptionId: data.provider_subscription_id,
    },
  );
}

export async function hasPremiumAccess(): Promise<boolean> {
  return (await getAccessState()).isPremium;
}
