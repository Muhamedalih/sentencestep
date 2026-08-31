import { createHmac, timingSafeEqual } from "node:crypto";

import type { BillingEvent } from "@/lib/billing/domain";
import { PREMIUM_PRICE } from "@/lib/billing/pricing";
import type {
  BillingProvider,
  CheckoutSessionInput,
  CheckoutSessionResult,
  ProviderSubscription,
  ProviderWebhookEvent,
} from "@/lib/billing/provider";

export interface PaytabsConfig {
  profileId: string;
  serverKey: string;
  /**
   * The exact PayTabs API domain assigned to this merchant account (e.g.
   * "https://secure.paytabs.com" or a region-specific domain) — get this
   * from the PayTabs merchant dashboard or account manager. Not defaulted
   * here: PayTabs assigns different domains per region/partner
   * (secure.paytabs.sa, secure-egypt.paytabs.com, etc.), and guessing the
   * wrong one would silently send real payment requests nowhere useful.
   */
  baseUrl: string;
}

interface PaytabsSaleResponse {
  tran_ref?: string;
  redirect_url?: string;
}

interface PaytabsWebhookPayload {
  tran_ref: string;
  cart_id?: string;
  payment_result?: { response_status?: string };
  respStatus?: string;
  user_defined?: { udf1?: string };
}

const PREMIUM_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function oneBillingPeriodFrom(date: Date): string {
  return new Date(date.getTime() + PREMIUM_PERIOD_MS).toISOString();
}

/**
 * PayTabs adapter for the BillingProvider boundary (see provider.ts). See
 * the Phase 3D report for the eligibility evidence: Iraq is an officially
 * supported merchant country via PayTabs' partnership with Amwal, a Central
 * Bank of Iraq-licensed payment processor, and PayTabs supports Visa/
 * Mastercard, recurring billing, webhooks (IPN), and settlement to local
 * accounts — all confirmed from paytabs.com/support.paytabs.com/
 * docs.paytabs.com.
 *
 * IMPLEMENTED, from official PayTabs documentation:
 *  - createCheckoutSession: a one-time hosted-checkout "sale" transaction
 *    (POST {baseUrl}/payment/request, tran_type "sale") granting one
 *    billing period (PREMIUM_PRICE.interval) of premium access per
 *    successful payment. The signed-in user's id is round-tripped through
 *    PayTabs' documented user_defined.udf1 field (confirmed: echoed back
 *    verbatim in the callback/IPN, never in the browser return response)
 *    so the webhook handler knows which user to credit — this is set
 *    server-side from a real Supabase session in checkout-actions.ts, never
 *    supplied by the client directly, so it can't be forged.
 *  - verifyWebhookSignature: HMAC-SHA256 of the raw request body, keyed by
 *    the merchant server key, compared against the `signature` header —
 *    exactly PayTabs' documented signature-verification algorithm.
 *  - translateWebhookEvent: maps a sale's respStatus (A/H/P/V/E/D, per
 *    PayTabs' documented response-status table) to our normalized
 *    checkout.completed / payment.failed events.
 *
 * DELIBERATELY NOT IMPLEMENTED — see the Phase 3D report's "Recurring
 * billing activation checklist":
 *  - True automatic recurring re-billing (PayTabs' "Repeat Billing" /
 *    Agreements API). PayTabs' own docs confirm this exists but requires
 *    "Recurring mode" to be enabled by a PayTabs account manager first (not
 *    self-serve), and public docs never specify the agreement response's
 *    id field name, the repeat_period/repeat_every unit encoding, or the
 *    first_installment_due_date semantics — only example payloads with
 *    unexplained numeric values. Guessing any of these would risk charging
 *    real users on the wrong schedule, so this adapter ships the confirmed
 *    one-time-sale path only: premium access is granted for one billing
 *    period per successful checkout, and lapses naturally
 *    (deriveAccessState in domain.ts already handles this correctly with
 *    no code change) unless the user checks out again.
 *  - getSubscription / cancelSubscription: PayTabs' public docs reference
 *    querying/cancelling an agreement from the merchant dashboard but never
 *    document a REST endpoint for doing either programmatically. Both throw
 *    a clear, actionable error rather than guess a URL.
 *  - createCustomerPortalSession: omitted (the interface allows this) — no
 *    PayTabs-hosted, customer-facing self-serve billing portal is
 *    documented; cancellation today is a manual PayTabs-dashboard action on
 *    the merchant's side.
 */
export function createPaytabsProvider(config: PaytabsConfig): BillingProvider {
  return {
    name: "paytabs",

    async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
      const origin = new URL(input.successUrl).origin;

      // PayTabs only supports a single `return` redirect (docs: "PayTabs
      // will redirect the customer to [this URL] after finishing the
      // payment process" — there is no separate on-cancel redirect), so
      // input.cancelUrl is intentionally unused here. This is fine, not a
      // bug: like every other provider wired through this interface,
      // premium access is only ever granted by the signed server-to-server
      // webhook below, never by which page the browser happens to land on.
      const response = await fetch(`${config.baseUrl}/payment/request`, {
        method: "POST",
        headers: {
          Authorization: config.serverKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: config.profileId,
          tran_type: "sale",
          tran_class: "ecom",
          cart_id: `sentencestep-premium-${input.userId}-${Date.now()}`,
          cart_currency: PREMIUM_PRICE.currency,
          cart_amount: PREMIUM_PRICE.amount,
          cart_description: `SentenceStep Premium — 1 ${PREMIUM_PRICE.interval}`,
          customer_details: { email: input.userEmail },
          return: input.successUrl,
          callback: `${origin}/api/billing/webhook`,
          user_defined: { udf1: input.userId },
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `PayTabs payment/request failed (${response.status}): ${body.slice(0, 500)}`,
        );
      }

      const data = (await response.json()) as PaytabsSaleResponse;
      if (!data.redirect_url) {
        throw new Error("PayTabs payment/request returned no redirect_url.");
      }

      return { url: data.redirect_url };
    },

    async getSubscription(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the BillingProvider interface; see the doc comment above for why this isn't implemented
      providerSubscriptionId: string,
    ): Promise<ProviderSubscription | null> {
      throw new Error(
        "PaytabsProvider.getSubscription is not implemented: PayTabs' public documentation does not " +
          "confirm an agreement-status-by-id query endpoint. Confirm the exact endpoint with a PayTabs " +
          "account manager (or the account's own Postman collection) before implementing this.",
      );
    },

    async cancelSubscription(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the BillingProvider interface; see the doc comment above for why this isn't implemented
      providerSubscriptionId: string,
    ): Promise<void> {
      throw new Error(
        "PaytabsProvider.cancelSubscription is not implemented: PayTabs' public documentation references " +
          "cancelling an agreement from the merchant dashboard but does not confirm a REST endpoint for " +
          "doing so programmatically. Confirm the exact endpoint with a PayTabs account manager (or the " +
          "account's own Postman collection) before implementing this.",
      );
    },

    verifyWebhookSignature(rawBody: string, signatureHeader: string | null): ProviderWebhookEvent {
      if (!signatureHeader) {
        throw new Error("Missing PayTabs webhook signature header.");
      }

      const expected = createHmac("sha256", config.serverKey).update(rawBody).digest("hex");
      const expectedBuf = Buffer.from(expected);
      const actualBuf = Buffer.from(signatureHeader);

      if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
        throw new Error("Invalid PayTabs webhook signature.");
      }

      let payload: PaytabsWebhookPayload;
      try {
        payload = JSON.parse(rawBody) as PaytabsWebhookPayload;
      } catch {
        throw new Error("PayTabs webhook body is not valid JSON.");
      }

      const status = payload.payment_result?.response_status ?? payload.respStatus ?? "";
      if (!payload.tran_ref) {
        throw new Error("PayTabs webhook body has no tran_ref.");
      }

      return { id: payload.tran_ref, type: status, data: payload };
    },

    translateWebhookEvent(event: ProviderWebhookEvent): BillingEvent[] {
      const payload = event.data as PaytabsWebhookPayload;
      const userId = payload.user_defined?.udf1;

      // No reliable way to credit this to a user without the round-tripped
      // udf1 — see the doc comment above. Never guess; drop the event.
      if (!userId) return [];

      const now = new Date();

      if (event.type === "A") {
        return [
          {
            type: "checkout.completed",
            // PayTabs has no separate "customer" concept for a plain
            // hosted-checkout sale — the app's own user id doubles as this
            // provider's customer id, which is exactly what the webhook
            // route (src/app/api/billing/webhook/route.ts) looks the
            // subscriptions row up by.
            providerCustomerId: userId,
            providerSubscriptionId: payload.tran_ref,
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: oneBillingPeriodFrom(now),
          },
        ];
      }

      if (event.type === "D" || event.type === "E" || event.type === "V") {
        return [
          {
            type: "payment.failed",
            providerCustomerId: userId,
            providerSubscriptionId: payload.tran_ref,
          },
        ];
      }

      // "H" (hold, pending anti-fraud review) and "P" (pending) are
      // deliberately not translated to any event — access is only ever
      // granted on a confirmed "A" (Authorised), never on a still-pending
      // result.
      return [];
    },
  };
}
