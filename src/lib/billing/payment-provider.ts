/**
 * The boundary every one-time payment provider implements. Premium access,
 * pricing, orders and fulfillment only ever talk to this interface — Wayl is
 * one implementation (providers/wayl.ts), so moving to another provider means
 * writing one new adapter and registering it in provider-registry.ts.
 */

export type PaymentStatus =
  "created" | "pending" | "processing" | "paid" | "failed" | "cancelled" | "refunded" | "unknown";

export interface CreatePaymentInput {
  /** Our own unique id for the order; the provider echoes it back. */
  referenceId: string;
  /** Whole units of `currency`. */
  amount: number;
  currency: string;
  webhookUrl: string;
  redirectUrl: string;
  /** Provider-agnostic duration such as "1h". */
  expiresIn: string;
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  checkoutUrl: string;
}

/** A provider's own record of a payment, read straight from its API. */
export interface ProviderPayment {
  referenceId: string;
  providerPaymentId: string;
  status: PaymentStatus;
  /** The provider's untranslated status string, kept for the order record. */
  rawStatus: string;
  amount: number;
  currency: string;
  paidAt: string | null;
}

/** A webhook whose signature has been verified. Nothing in it is trusted beyond locating the order. */
export interface VerifiedWebhook {
  referenceId: string;
  /** Best-effort key for the audit log; null when the payload offers none. */
  eventId: string | null;
  eventType: string;
  payload: unknown;
}

export interface HeadersLike {
  get(name: string): string | null;
}

export interface PaymentProvider {
  readonly name: string;
  readonly environment: "live" | "test";
  /** The only currency this provider can charge in. */
  readonly settlementCurrency: string;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  /** The source of truth for a payment's state. Null when the provider has no such payment. */
  getPayment(referenceId: string): Promise<ProviderPayment | null>;

  /** Same as getPayment for many orders in one call; payments the provider does not know are omitted. */
  getPayments(referenceIds: string[]): Promise<ProviderPayment[]>;

  /**
   * Verifies a webhook against the exact raw request bytes. Must throw
   * InvalidWebhookSignatureError on a bad signature (never trust an unverified
   * body) and MalformedWebhookError on a validly signed but unusable payload.
   */
  verifyWebhook(rawBody: Uint8Array, headers: HeadersLike): VerifiedWebhook;
}

export class InvalidWebhookSignatureError extends Error {
  constructor(message = "Invalid webhook signature.") {
    super(message);
    this.name = "InvalidWebhookSignatureError";
  }
}

export class MalformedWebhookError extends Error {
  constructor(message = "Malformed webhook payload.") {
    super(message);
    this.name = "MalformedWebhookError";
  }
}

/** A failed call to the provider's API. `retryable` is true for outages and timeouts, false for rejections. */
export class PaymentProviderError extends Error {
  readonly retryable: boolean;
  readonly status: number | null;

  constructor(message: string, options: { retryable: boolean; status?: number | null }) {
    super(message);
    this.name = "PaymentProviderError";
    this.retryable = options.retryable;
    this.status = options.status ?? null;
  }
}
