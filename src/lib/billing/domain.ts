import { FREE_ACCESS } from "@/lib/billing/types";
import type { AccessState, Plan, SubscriptionStatus } from "@/lib/billing/types";

// --- The billing domain's pure decision logic. ---
//
// Nothing here talks to Supabase, a payment provider, or the network — it
// only ever transforms plain data. That's deliberate: it's what lets
// domain.test.ts exercise every state (free, active, expired, cancelled
// mid-period, past-due, missing, duplicate event...) deterministically,
// without a database or a payment provider. src/lib/billing/access.ts is
// the thin I/O wrapper that fetches a row and hands it to deriveAccessState;
// a future webhook handler is the thin I/O wrapper that hands provider
// events to applyBillingEvent.

/** The subset of a subscriptions row this module actually reasons about. */
export interface SubscriptionRow {
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
}

const LIFECYCLE_STATUSES_WITH_ACCESS: SubscriptionStatus[] = ["active", "trialing"];

/**
 * The single place "does this row grant premium access right now" is
 * decided. past_due is deliberately excluded — a failed payment revokes
 * access immediately rather than during a grace period, so a temporary
 * billing hiccup can never look like abandoned, permanent free access from
 * the provider's side while still quietly working for the user.
 */
export function deriveAccessState(
  record: SubscriptionRow | null,
  now: Date = new Date(),
): AccessState {
  if (!record) return FREE_ACCESS;

  const notExpired = !record.currentPeriodEnd || new Date(record.currentPeriodEnd) > now;
  const hasActiveLifecycle = LIFECYCLE_STATUSES_WITH_ACCESS.includes(record.status);
  const isPremium = record.plan === "premium" && hasActiveLifecycle && notExpired;

  return {
    plan: record.plan,
    status: record.status,
    expiresAt: record.currentPeriodEnd,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    isPremium,
  };
}

// --- Normalized billing events. ---
//
// A real provider adapter's job is to verify its webhook signature and
// translate its own payload shape into these — see the
// BillingProvider.translateWebhookEvent boundary in provider.ts. Nothing
// downstream of applyBillingEvent needs to know which provider produced the
// event.

export type BillingEventType =
  | "checkout.completed"
  | "subscription.activated"
  | "subscription.renewed"
  | "subscription.cancelled"
  | "subscription.expired"
  | "payment.failed";

export interface BillingEvent {
  type: BillingEventType;
  providerCustomerId: string;
  providerSubscriptionId: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
}

const EMPTY_SUBSCRIPTION: SubscriptionRow = {
  plan: "free",
  status: "free",
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  providerCustomerId: null,
  providerSubscriptionId: null,
};

/**
 * Computes the next subscription row for a normalized billing event. Pure
 * and total — every event type produces a defined result, and an unknown
 * type is a no-op rather than a thrown error, since a webhook handler
 * should never crash on an event it doesn't recognize yet.
 *
 * subscription.cancelled does NOT revoke access immediately: it only sets
 * cancel_at_period_end, matching how real providers behave (the customer
 * keeps what they already paid for until the period actually ends).
 * subscription.expired is the event that later, actually ends access, once
 * that period passes.
 */
export function applyBillingEvent(
  current: SubscriptionRow | null,
  event: BillingEvent,
): SubscriptionRow {
  const base = current ?? EMPTY_SUBSCRIPTION;

  switch (event.type) {
    case "checkout.completed":
    case "subscription.activated":
    case "subscription.renewed":
      return {
        ...base,
        plan: "premium",
        status: "active",
        currentPeriodStart: event.currentPeriodStart ?? base.currentPeriodStart,
        currentPeriodEnd: event.currentPeriodEnd ?? base.currentPeriodEnd,
        cancelAtPeriodEnd: false,
        providerCustomerId: event.providerCustomerId,
        providerSubscriptionId: event.providerSubscriptionId,
      };
    case "subscription.cancelled":
      return { ...base, cancelAtPeriodEnd: true };
    case "subscription.expired":
      return { ...base, plan: "free", status: "expired", cancelAtPeriodEnd: false };
    case "payment.failed":
      return { ...base, status: "past_due" };
    default:
      return base;
  }
}
