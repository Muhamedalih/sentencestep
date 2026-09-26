import { createHmac, timingSafeEqual } from "node:crypto";

import type { BillingEvent } from "@/lib/billing/domain";
import { WAYL_PREMIUM_PRICE_IQD } from "@/lib/billing/pricing";
import type {
  BillingProvider,
  CheckoutSessionInput,
  CheckoutSessionResult,
  ProviderSubscription,
  ProviderWebhookEvent,
} from "@/lib/billing/provider";

export interface WaylConfig {
  apiKey: string;
  webhookSecret: string;
  environment: WaylEnvironment;
  /** Defaults to https://api.thewayl.com — Wayl has a single API host (no separate sandbox host); `environment` selects live vs. test on each request. */
  baseUrl?: string;
}

export type WaylEnvironment = "test" | "live";

const DEFAULT_BASE_URL = "https://api.thewayl.com";

/** Separates "sentencestep-premium", the user id, and a uniqueness timestamp — `__` rather than `-` because a Supabase user id is itself a hyphenated UUID. */
const REFERENCE_ID_SEPARATOR = "__";

interface WaylLinkData {
  referenceId: string;
  id: string;
  total: string | number;
  currency: string;
  status: string;
  url: string;
}

interface WaylLinkEnvelope {
  message?: string;
  data?: WaylLinkData;
}

/**
 * Resolves the `env` value sent on every Wayl request. Per Wayl's docs, use
 * "test" while testing and switch to "live" only when going live. Fails
 * closed (returns null — the honest "not configured" state getBillingProvider
 * already uses everywhere else) rather than ever silently taking real
 * payments or silently staying in test mode in production:
 *  - production requires WAYL_ENV=live explicitly; missing, "test", or
 *    anything else disables the provider entirely.
 *  - outside production, a missing WAYL_ENV defaults to "test" so a stray
 *    deployment can never accidentally take live payments; WAYL_ENV=live can
 *    still be set intentionally (e.g. to smoke-test the live flow from a
 *    staging environment).
 */
export function resolveWaylEnvironment(
  rawEnv: string | undefined,
  nodeEnv: string | undefined,
): WaylEnvironment | null {
  const requested = rawEnv?.trim().toLowerCase();
  const isProduction = nodeEnv === "production";

  if (!requested) return isProduction ? null : "test";
  if (requested !== "test" && requested !== "live") return null;
  if (isProduction && requested !== "live") return null;
  return requested;
}

function buildReferenceId(userId: string): string {
  return ["sentencestep-premium", userId, Date.now().toString()].join(REFERENCE_ID_SEPARATOR);
}

/** Returns the round-tripped user id, or null if referenceId isn't one this adapter minted (never guessed). */
function userIdFromReferenceId(referenceId: string): string | null {
  const parts = referenceId.split(REFERENCE_ID_SEPARATOR);
  if (parts.length !== 3 || parts[0] !== "sentencestep-premium") return null;
  return parts[1] || null;
}

function isWaylLinkData(value: unknown): value is WaylLinkData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.referenceId === "string" &&
    typeof data.id === "string" &&
    (typeof data.total === "string" || typeof data.total === "number") &&
    typeof data.currency === "string" &&
    typeof data.status === "string" &&
    typeof data.url === "string"
  );
}

function parseLinkEnvelope(raw: unknown): WaylLinkData {
  const envelope = raw as WaylLinkEnvelope | null;
  if (!envelope || !isWaylLinkData(envelope.data)) {
    throw new Error("Wayl response did not match the documented { data: { ... } } link shape.");
  }
  return envelope.data;
}

/**
 * Wayl adapter for the BillingProvider boundary (see provider.ts). Wayl
 * (https://wayl.io) is a Baghdad-based, Central Bank of Iraq-licensed
 * payment aggregator — chosen because a real merchant account already
 * exists for it, unlike PayTabs (see providers/paytabs.ts, kept in the repo
 * unconfigured/dormant).
 *
 * Source of truth (researched, not guessed):
 *  - https://docs.thewayl.com (integration guide) and
 *    https://api.thewayl.com/reference (API reference) — both unreachable
 *    from this environment's network egress policy, so every detail below
 *    was cross-checked instead against a real, working Wayl integration
 *    (github.com/JAAFAR1996/AQUAVO, PR #215 "Replace Al-Qaseh with Wayl
 *    online payments") that itself cites and quotes those two sources.
 *    CONFIRM against the real docs (or a Wayl sandbox key) before taking a
 *    real payment — nothing here has been exercised against Wayl's actual
 *    API yet, same caveat PayTabs' adapter carries.
 *
 * Confirmed facts:
 *  - Single API host https://api.thewayl.com; an `env` field of "live" or
 *    "test" on each request selects the mode (no separate sandbox host).
 *  - Auth: `X-WAYL-AUTHENTICATION: <merchant API key>` header on every
 *    request. Issued by Wayl (email jisr@wayl.io) or found in the merchant
 *    dashboard — there is no publicly published sandbox key, so a real key
 *    is required even for env="test".
 *  - POST /api/v1/links creates a payment link. Body fields used here: env,
 *    referenceId (merchant-chosen, up to 250 chars — used here to round-trip
 *    the user id, see buildReferenceId), total, currency, webhookUrl,
 *    webhookSecret, redirectionUrl.
 *  - GET /api/v1/links/{referenceId} retrieves a link's current,
 *    authoritative state.
 *  - Webhooks are signed: header `x-wayl-signature-256` =
 *    HMAC-SHA256(rawBody, webhookSecret) as hex (optionally prefixed
 *    "sha256=").
 *  - Response envelope for both endpoints above: `{ message, data: {
 *    referenceId, id, total, currency, status, url, ... } }`. `data.url` is
 *    the hosted checkout URL. Documented statuses: Created, Pending,
 *    Processing, Complete, Delivered, Cancelled, Rejected, Returned — only
 *    "Complete" is a confirmed successful payment.
 *
 * Design choices deliberately different from the AQUAVO reference:
 *  - ONE webhookSecret from WAYL_WEBHOOK_SECRET is sent on every checkout,
 *    rather than a fresh random secret minted and stored per payment link.
 *    Wayl's docs list webhookSecret as a per-request, optional field, so a
 *    fixed value is entirely valid — this keeps verifyWebhookSignature
 *    stateless (no database read before a signature can even be checked),
 *    matching how PayTabs' adapter — and the shared BillingProvider
 *    interface — already work. A single merchant-wide signing secret is
 *    also exactly how e.g. Stripe's webhook secrets work.
 *  - The webhook POST body's only field this adapter relies on is
 *    `referenceId` — confirmed present because AQUAVO's own webhook handler
 *    reads exactly that field and nothing else from the raw body. Every
 *    other fact (status, amount, currency) comes from the authoritative
 *    GET /api/v1/links/{referenceId} call made inside verifyWebhookSignature
 *    itself, never from trusting the webhook body — matching Wayl's own
 *    documented integration pattern ("treat the webhook as a trigger, not
 *    proof"). This also sidesteps guessing at any other webhook body field
 *    Wayl might send, which isn't confirmed anywhere reachable from here.
 *  - getSubscription / cancelSubscription: not implemented, same as
 *    PayTabs — Wayl's confirmed API is one-time payment links, no recurring
 *    subscription object to query or cancel programmatically. A successful
 *    checkout grants one billing period (see domain.ts), same lapsing
 *    behavior as PayTabs.
 *  - createCustomerPortalSession: omitted — no Wayl-hosted, customer-facing
 *    self-serve billing portal is documented; cancellation/refunds today are
 *    a manual Wayl-merchant-dashboard action.
 */
export function createWaylProvider(config: WaylConfig): BillingProvider {
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");

  async function waylFetch(path: string, init: RequestInit = {}): Promise<unknown> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "X-WAYL-AUTHENTICATION": config.apiKey,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });

    const text = await response.text().catch(() => "");
    if (!response.ok) {
      throw new Error(`Wayl ${path} failed (${response.status}): ${text.slice(0, 500)}`);
    }
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Wayl ${path} returned a non-JSON response: ${text.slice(0, 500)}`);
    }
  }

  return {
    name: "wayl",

    async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
      const origin = new URL(input.successUrl).origin;
      const referenceId = buildReferenceId(input.userId);

      // Wayl, like PayTabs, only supports one post-payment redirect — see
      // paytabs.ts's identical note. input.cancelUrl is intentionally unused;
      // premium access is only ever granted by the signed webhook below.
      const raw = await waylFetch("/api/v1/links", {
        method: "POST",
        body: JSON.stringify({
          env: config.environment,
          referenceId,
          total: WAYL_PREMIUM_PRICE_IQD,
          currency: "IQD",
          webhookUrl: `${origin}/api/billing/webhook`,
          webhookSecret: config.webhookSecret,
          redirectionUrl: input.successUrl,
        }),
      });

      const link = parseLinkEnvelope(raw);
      if (link.referenceId !== referenceId) {
        throw new Error("Wayl echoed a different referenceId than the one requested.");
      }

      return { url: link.url };
    },

    async getSubscription(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the BillingProvider interface; see the doc comment above for why this isn't implemented
      providerSubscriptionId: string,
    ): Promise<ProviderSubscription | null> {
      throw new Error(
        "WaylProvider.getSubscription is not implemented: Wayl's confirmed API is one-time payment " +
          "links, with no recurring-subscription object to query.",
      );
    },

    async cancelSubscription(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the BillingProvider interface; see the doc comment above for why this isn't implemented
      providerSubscriptionId: string,
    ): Promise<void> {
      throw new Error(
        "WaylProvider.cancelSubscription is not implemented: Wayl's confirmed API is one-time payment " +
          "links, with no recurring subscription to cancel programmatically.",
      );
    },

    async verifyWebhookSignature(
      rawBody: string,
      signatureHeader: string | null,
    ): Promise<ProviderWebhookEvent> {
      if (!signatureHeader) {
        throw new Error("Missing Wayl webhook signature header.");
      }

      const provided = signatureHeader
        .trim()
        .toLowerCase()
        .replace(/^sha256=/, "");
      if (!/^[0-9a-f]{64}$/.test(provided)) {
        throw new Error("Malformed Wayl webhook signature header.");
      }

      const expected = createHmac("sha256", config.webhookSecret).update(rawBody).digest("hex");
      if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"))) {
        throw new Error("Invalid Wayl webhook signature.");
      }

      let payload: { referenceId?: unknown };
      try {
        payload = JSON.parse(rawBody) as { referenceId?: unknown };
      } catch {
        throw new Error("Wayl webhook body is not valid JSON.");
      }

      if (typeof payload.referenceId !== "string" || !payload.referenceId) {
        throw new Error("Wayl webhook body has no referenceId.");
      }

      // The webhook body is only ever a trigger to look this reference up —
      // never proof of anything by itself (see this module's doc comment).
      // Everything downstream (translateWebhookEvent) acts only on this
      // authoritative, freshly-fetched state.
      const raw = await waylFetch(`/api/v1/links/${encodeURIComponent(payload.referenceId)}`, {
        method: "GET",
      });
      const link = parseLinkEnvelope(raw);
      if (link.referenceId !== payload.referenceId) {
        throw new Error("Wayl link lookup returned a different referenceId than requested.");
      }

      return { id: link.id, type: link.status, data: link };
    },

    translateWebhookEvent(event: ProviderWebhookEvent): BillingEvent[] {
      const link = event.data as WaylLinkData;
      const userId = userIdFromReferenceId(link.referenceId);

      // Not a referenceId this adapter minted — never guess who to credit.
      if (!userId) return [];

      if (event.type === "Complete") {
        const total = typeof link.total === "string" ? Number(link.total) : link.total;
        // Defense in depth: a link reporting Complete for the wrong amount/
        // currency is never treated as a valid payment for this product,
        // even though it's already signature- and reference-verified.
        if (link.currency !== "IQD" || total !== WAYL_PREMIUM_PRICE_IQD) return [];

        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return [
          {
            type: "checkout.completed",
            providerCustomerId: userId,
            providerSubscriptionId: link.id,
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: periodEnd.toISOString(),
          },
        ];
      }

      if (event.type === "Cancelled" || event.type === "Rejected") {
        return [
          {
            type: "payment.failed",
            providerCustomerId: userId,
            providerSubscriptionId: link.id,
          },
        ];
      }

      // Created/Pending/Processing/Delivered/Returned, and anything Wayl
      // introduces later: never grant or revoke access on an unconfirmed or
      // post-payment state.
      return [];
    },
  };
}
