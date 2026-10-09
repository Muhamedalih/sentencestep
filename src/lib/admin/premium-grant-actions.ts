"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { parseGrantDays, planPremiumGrant } from "@/lib/admin/premium-grant";
import { findUserByEmail } from "@/lib/admin/users-lookup";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

const GRANT_PROVIDER = "admin_grant";

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Gives any registered account free Premium days, whether or not they have ever
 * subscribed: days stack on Premium they still have and otherwise start now
 * (planPremiumGrant). The subscriptions table can only be written by the
 * service-role connection, so requireAdmin() is what makes reaching this code
 * conditional on the caller being a real admin. The account must already exist;
 * a subscription belongs to an auth user, so there is nothing to attach days to
 * for an email that has never signed up.
 */
export async function grantPremiumByEmail(email: string, days: number): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (!isServiceRoleConfigured())
    return { error: "Service role key isn't configured for this environment." };

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { error: "Enter an email address." };

  const parsedDays = parseGrantDays(days);
  if (!parsedDays.ok) return { error: parsedDays.error };

  const found = await findUserByEmail(normalizedEmail);
  if (found.status === "error")
    return { error: "Couldn't search for that user. Please try again." };
  if (found.status === "not_found") {
    return { error: "No account found with that email. They need to sign up first." };
  }

  const serviceRole = createServiceRoleClient();
  const { data: existing, error: readError } = await serviceRole
    .from("subscriptions")
    .select("*")
    .eq("user_id", found.id)
    .maybeSingle();
  if (readError) return { error: "Couldn't read that account's subscription. Please try again." };

  const now = new Date();
  const plan = planPremiumGrant(
    existing && {
      plan: existing.plan,
      status: existing.status,
      currentPeriodStart: existing.current_period_start,
      currentPeriodEnd: existing.current_period_end,
      cancelAtPeriodEnd: existing.cancel_at_period_end,
      providerCustomerId: existing.provider_customer_id,
      providerSubscriptionId: existing.provider_subscription_id,
    },
    parsedDays.days,
    now,
  );
  if (plan.kind === "unlimited") {
    return {
      error: `${found.email} already has Premium with no end date, so there is nothing to add.`,
    };
  }

  // A one-time grant never renews, so cancel_at_period_end stays true like a
  // paid order's (the app reads it to show "Premium until <date>"). Whatever
  // provider the account already has is kept, so its payment history still reads true.
  const { error: writeError } = await serviceRole.from("subscriptions").upsert(
    {
      user_id: found.id,
      plan: "premium",
      status: "active",
      current_period_start: plan.start,
      current_period_end: plan.end,
      cancel_at_period_end: true,
      provider: existing?.provider ?? GRANT_PROVIDER,
      provider_customer_id: existing?.provider_customer_id ?? found.id,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (writeError) return { error: "Couldn't save that. Please try again." };

  void logAdminAction("subscription.premium_granted", "subscription", found.id, {
    email: found.email,
    days: parsedDays.days,
    previousEnd: existing?.current_period_end ?? null,
    newEnd: plan.end,
    extendedExisting: plan.extendedExisting,
  });
  revalidatePath("/admin/premium");
  return {
    success: `${found.email} has Premium until ${formatDay(plan.end)} (+${parsedDays.days} days${
      plan.extendedExisting ? ", added to their current Premium" : ""
    }).`,
  };
}
