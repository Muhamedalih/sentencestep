import { createHmac, timingSafeEqual } from "node:crypto";

import {
  InvalidWebhookSignatureError,
  MalformedWebhookError,
  PaymentProviderError,
} from "@/lib/billing/payment-provider";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  HeadersLike,
  PaymentProvider,
  PaymentStatus,
  ProviderPayment,
  VerifiedWebhook,
} from "@/lib/billing/payment-provider";

export interface WaylConfig {
  apiKey: string;
  /** Sent as `webhookSecret` on every link and used to verify the signature of every webhook. */
  webhookSecret: string;
  environment: "live" | "test";
  /**
   * Ask Wayl's hosted page to show the price in dollars (see withUsdDisplay).
   * On unless explicitly false; off leaves the page showing dinars, which is
   * what to do while Wayl's own dollar rate and ours differ.
   */
  showUsd?: boolean;
  fetch?: typeof fetch;
}

// Wayl's test mode is the `env` field on a link, on this same API and with the
// same key — not a separate server or account.
const BASE_URL = "https://api.thewayl.com";

// Short enough that a slow Wayl can't push a page or checkout past the host's function time limit.
const REQUEST_TIMEOUT_MS = 6_000;
const BATCH_SIZE = 100;
const ERROR_BODY_PREVIEW_CHARS = 300;
const SIGNATURE_HEADER = "x-wayl-signature-256";

interface WaylLink {
  id?: unknown;
  referenceId?: unknown;
  total?: unknown;
  currency?: unknown;
  status?: unknown;
  completedAt?: unknown;
  url?: unknown;
}

export function mapWaylStatus(rawStatus: string): PaymentStatus {
  switch (rawStatus.trim().toLowerCase()) {
    case "created":
      return "created";
    case "pending":
      return "pending";
    case "processing":
      return "processing";
    // Delivered only ever follows Complete (it is the post-payment fulfilment step).
    case "complete":
    case "delivered":
      return "paid";
    case "cancelled":
      return "cancelled";
    case "rejected":
      return "failed";
    case "returned":
      return "refunded";
    default:
      return "unknown";
  }
}

// Wayl's webhook describes the buyer (name, city, phone...) under `customer`.
// Nothing here needs that, and the payload is kept for the audit log, so
// anything that looks personal is dropped, at every depth, before it leaves
// the adapter.
const PERSONAL_KEY = /customer|buyer|name|phone|mobile|email|address|city|contact/i;

export function withoutPersonalData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutPersonalData);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !PERSONAL_KEY.test(key))
        .map(([key, inner]) => [key, withoutPersonalData(inner)]),
    );
  }
  return value;
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Per Wayl support, a payment link that carries `currency=usd` shows its price
 * in US dollars on Wayl's hosted page. Only that display changes here: the link
 * is still created in IQD (the one currency Wayl's API takes) and every
 * payment is still verified against the IQD total on the link.
 */
export function withUsdDisplay(checkoutUrl: string): string {
  const url = new URL(checkoutUrl);
  url.searchParams.set("currency", "usd");
  return url.toString();
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function toProviderPayment(link: WaylLink): ProviderPayment {
  if (
    typeof link.id !== "string" ||
    typeof link.referenceId !== "string" ||
    typeof link.status !== "string" ||
    typeof link.currency !== "string"
  ) {
    throw new PaymentProviderError("Wayl returned a link in an unexpected shape.", {
      retryable: false,
    });
  }

  const amount = Number(link.total);
  if (link.total === null || link.total === "" || !Number.isFinite(amount)) {
    throw new PaymentProviderError("Wayl returned a link with no usable total.", {
      retryable: false,
    });
  }

  const completedAt =
    typeof link.completedAt === "string" && !Number.isNaN(Date.parse(link.completedAt))
      ? new Date(link.completedAt).toISOString()
      : null;

  return {
    referenceId: link.referenceId,
    providerPaymentId: link.id,
    status: mapWaylStatus(link.status),
    rawStatus: link.status,
    amount,
    currency: link.currency,
    paidAt: completedAt,
  };
}

/**
 * Wayl adapter for the PaymentProvider boundary (see payment-provider.ts):
 * one-time hosted payment links only. Wayl's API charges in IQD only and
 * documents no recurring/subscription endpoints, so nothing here assumes
 * either. The API key is only ever sent as a request header from the server
 * and is never placed in an error message.
 */
export function createWaylProvider(config: WaylConfig): PaymentProvider {
  async function request(path: string, init: { method: "GET" | "POST"; body?: unknown }) {
    const fetchImpl = config.fetch ?? globalThis.fetch;
    let response: Response;
    try {
      response = await fetchImpl(`${BASE_URL}${path}`, {
        method: init.method,
        headers: {
          "X-WAYL-AUTHENTICATION": config.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      throw new PaymentProviderError(`Wayl ${init.method} ${path} failed to complete: ${reason}`, {
        retryable: true,
      });
    }
    return response;
  }

  async function failureFromResponse(
    method: string,
    path: string,
    response: Response,
  ): Promise<PaymentProviderError> {
    const body = await response.text().catch(() => "");
    // Redact before truncating, so a secret cut in half by the limit can't survive.
    const preview = [config.apiKey, config.webhookSecret]
      .filter((secret) => secret !== "")
      .reduce((text, secret) => text.split(secret).join("[redacted]"), body)
      .slice(0, ERROR_BODY_PREVIEW_CHARS);
    const retryable = response.status >= 500 || response.status === 429 || response.status === 408;
    return new PaymentProviderError(
      `Wayl ${method} ${path} failed (${response.status}): ${preview}`,
      {
        retryable,
        status: response.status,
      },
    );
  }

  async function readData(response: Response, path: string): Promise<unknown> {
    try {
      const body = (await response.json()) as { data?: unknown } | null;
      return body?.data;
    } catch {
      throw new PaymentProviderError(`Wayl ${path} returned a response that is not valid JSON.`, {
        retryable: false,
        status: response.status,
      });
    }
  }

  return {
    name: "wayl",
    environment: config.environment,
    settlementCurrency: "IQD",

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const path = "/api/v1/links";
      const response = await request(path, {
        method: "POST",
        body: {
          env: config.environment,
          referenceId: input.referenceId,
          total: input.amount,
          currency: input.currency,
          // Wayl's own guide shows links created with line items that add up to the total.
          lineItem: [{ label: input.description, amount: input.amount, type: "increase" }],
          webhookUrl: input.webhookUrl,
          webhookSecret: config.webhookSecret,
          redirectionUrl: input.redirectUrl,
          linkExpiresIn: input.expiresIn,
        },
      });
      if (!response.ok) throw await failureFromResponse("POST", path, response);

      const link = (await readData(response, path)) as WaylLink | undefined;
      const matchesRequest =
        link !== undefined &&
        link !== null &&
        typeof link.id === "string" &&
        link.id !== "" &&
        link.referenceId === input.referenceId &&
        link.currency === input.currency &&
        Number(link.total) === input.amount;
      if (!matchesRequest || !isHttpsUrl(link.url)) {
        throw new PaymentProviderError(
          "Wayl created a link that does not match the request (reference, amount, currency or URL).",
          { retryable: false },
        );
      }

      return {
        providerPaymentId: link.id as string,
        checkoutUrl: config.showUsd === false ? link.url : withUsdDisplay(link.url),
      };
    },

    async getPayment(referenceId: string): Promise<ProviderPayment | null> {
      const path = `/api/v1/links/${encodeURIComponent(referenceId)}`;
      const response = await request(path, { method: "GET" });
      if (response.status === 404) return null;
      if (!response.ok) throw await failureFromResponse("GET", path, response);

      const link = (await readData(response, path)) as WaylLink | undefined;
      if (!link || typeof link !== "object") {
        throw new PaymentProviderError("Wayl returned no link for a successful lookup.", {
          retryable: false,
        });
      }
      return toProviderPayment(link);
    },

    async getPayments(referenceIds: string[]): Promise<ProviderPayment[]> {
      const payments: ProviderPayment[] = [];
      for (let start = 0; start < referenceIds.length; start += BATCH_SIZE) {
        const path = "/api/v1/links/batch";
        const response = await request(path, {
          method: "POST",
          body: { referenceIds: referenceIds.slice(start, start + BATCH_SIZE) },
        });
        if (!response.ok) throw await failureFromResponse("POST", path, response);

        const links = await readData(response, path);
        if (!Array.isArray(links)) {
          throw new PaymentProviderError("Wayl returned a batch lookup with no list of links.", {
            retryable: false,
          });
        }
        for (const link of links) payments.push(toProviderPayment(link as WaylLink));
      }
      return payments;
    },

    verifyWebhook(rawBody: Uint8Array, headers: HeadersLike): VerifiedWebhook {
      const header = headers.get(SIGNATURE_HEADER);
      if (!header) {
        throw new InvalidWebhookSignatureError(`Missing ${SIGNATURE_HEADER} header.`);
      }

      const digest = createHmac("sha256", config.webhookSecret).update(rawBody).digest();
      const presented = header.trim().replace(/^sha256=/i, "");
      // Wayl's docs name the header and HMAC-SHA256 but this accepts either
      // standard encoding; the signature must still match the exact raw bytes.
      const matchesHex = safeEqual(presented.toLowerCase(), digest.toString("hex"));
      const matchesBase64 = safeEqual(presented, digest.toString("base64"));
      if (!matchesHex && !matchesBase64) {
        throw new InvalidWebhookSignatureError("Invalid Wayl webhook signature.");
      }

      let payload: unknown;
      try {
        payload = JSON.parse(Buffer.from(rawBody).toString("utf8"));
      } catch {
        throw new MalformedWebhookError("Wayl webhook body is not valid JSON.");
      }

      // Wayl's dashboard shows the payload as { verb, event: "order.created",
      // referenceId, paymentStatus, total, customer, … }. Only referenceId is
      // used to find the order; the event name is just for the audit log.
      const fields = (payload ?? {}) as {
        referenceId?: unknown;
        id?: unknown;
        event?: unknown;
        status?: unknown;
      };
      if (typeof fields.referenceId !== "string" || fields.referenceId === "") {
        throw new MalformedWebhookError("Wayl webhook payload has no referenceId.");
      }

      const eventType =
        typeof fields.event === "string" && fields.event !== ""
          ? fields.event
          : typeof fields.status === "string"
            ? fields.status
            : "unknown";
      const eventId =
        typeof fields.id === "string" && fields.id !== "" ? `${fields.id}:${eventType}` : null;

      return {
        referenceId: fields.referenceId,
        eventId,
        eventType,
        payload: withoutPersonalData(payload),
      };
    },
  };
}
