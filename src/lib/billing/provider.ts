import type { BillingEvent } from "@/lib/billing/domain";
import type { SubscriptionStatus } from "@/lib/billing/types";

/**
 * The boundary every real payment provider implements — see
 * src/lib/billing/providers/paytabs.ts, the adapter chosen in Phase 3D (see
 * that report for the Iraq-merchant-eligibility research behind the
 * choice). The rest of the app — checkout actions, the webhook route, the
 * upgrade page — only ever talks to this interface, never to a provider's
 * SDK directly. Swapping providers, or adding a second one, means writing
 * one new file that implements this and registering it in
 * provider-registry.ts; nothing else changes.
 */

export interface CheckoutSessionInput {
  userId: string;
  userEmail: string;
  /** Where to send the user after a successful checkout. */
  successUrl: string;
  /** Where to send the user if they abandon checkout. */
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  url: string;
}

export interface CustomerPortalResult {
  url: string;
}

export interface ProviderSubscription {
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/** A provider's webhook payload, verified but not yet interpreted. */
export interface ProviderWebhookEvent {
  /** The provider's own event id — used as the idempotency key. */
  id: string;
  /** The provider's own event type string (e.g. "customer.subscription.updated"). */
  type: string;
  data: unknown;
}

export interface BillingProvider {
  readonly name: string;

  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;

  /** Not every provider offers a hosted billing portal — omit this method if one doesn't. */
  createCustomerPortalSession?(
    providerCustomerId: string,
    returnUrl: string,
  ): Promise<CustomerPortalResult>;

  getSubscription(providerSubscriptionId: string): Promise<ProviderSubscription | null>;

  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  /** Verifies the raw request against the provider's signature header. Must throw on an invalid signature — never treat an unverified body as trustworthy. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): ProviderWebhookEvent;

  /** Maps a provider-specific event into our normalized, provider-agnostic events — see applyBillingEvent in domain.ts. A single provider event may translate to zero or more of these. */
  translateWebhookEvent(event: ProviderWebhookEvent): BillingEvent[];
}
