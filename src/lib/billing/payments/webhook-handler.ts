import { createHash } from "node:crypto";

import {
  InvalidWebhookSignatureError,
  MalformedWebhookError,
} from "@/lib/billing/payment-provider";
import type { HeadersLike } from "@/lib/billing/payment-provider";

import { verifyAndFulfill } from "./fulfillment";
import type { FulfillmentDeps, FulfillmentOutcome } from "./fulfillment";

export const MAX_WEBHOOK_BYTES = 64 * 1024;

export interface WebhookDeps extends FulfillmentDeps {
  /** Audit log + duplicate short-circuit (billing_events). Failures here never block processing. */
  recordEvent(event: {
    id: string;
    provider: string;
    type: string;
    payload: unknown;
  }): Promise<"recorded" | "already-processed" | "retry">;
  markEventProcessed(id: string): Promise<void>;
}

export interface WebhookResponse {
  status: number;
  body: Record<string, unknown>;
}

const SETTLED_OUTCOMES: readonly FulfillmentOutcome["outcome"][] = [
  "fulfilled",
  "already_fulfilled",
  "closed",
  "needs_review",
  "unknown_reference",
  "wrong_environment",
];

/**
 * Turns a raw webhook delivery into an HTTP response. The signature is
 * verified against the exact raw bytes first, and even then the payload is
 * only used to find the order: whether to grant premium is decided by asking
 * the provider's own API (verifyAndFulfill). So a replayed, forged-but-signed,
 * or simply wrong webhook can never activate premium by itself.
 *
 * Responses are chosen for the provider's retry behaviour: 401/400 for
 * deliveries that will never become valid, 200 for everything handled
 * (including "not paid yet" and unknown references, which retrying cannot
 * fix), and 503 only for transient failures worth retrying.
 */
export async function handleProviderWebhook(
  deps: WebhookDeps,
  rawBody: Uint8Array,
  headers: HeadersLike,
): Promise<WebhookResponse> {
  if (rawBody.byteLength > MAX_WEBHOOK_BYTES) {
    return { status: 413, body: { error: "Payload too large." } };
  }

  let verified;
  try {
    verified = deps.provider.verifyWebhook(rawBody, headers);
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return { status: 401, body: { error: "Invalid webhook signature." } };
    }
    if (error instanceof MalformedWebhookError) {
      return { status: 400, body: { error: "Malformed webhook payload." } };
    }
    return { status: 400, body: { error: "Unreadable webhook." } };
  }

  const eventId =
    verified.eventId ?? `sha256:${createHash("sha256").update(rawBody).digest("hex")}`;
  const auditId = `${deps.provider.name}:${eventId}`;

  let recorded: "recorded" | "already-processed" | "retry" = "recorded";
  try {
    recorded = await deps.recordEvent({
      id: auditId,
      provider: deps.provider.name,
      type: verified.eventType,
      payload: verified.payload,
    });
  } catch (error) {
    console.error("[payments] webhook audit record failed", error);
  }

  if (recorded === "already-processed") {
    return { status: 200, body: { received: true, duplicate: true } };
  }

  let outcome: FulfillmentOutcome;
  try {
    outcome = await verifyAndFulfill(deps, verified.referenceId, "webhook");
  } catch (error) {
    console.error("[payments] webhook verification failed", {
      referenceId: verified.referenceId,
      error,
    });
    return { status: 503, body: { error: "Temporarily unable to verify the payment." } };
  }

  if (SETTLED_OUTCOMES.includes(outcome.outcome)) {
    await deps.markEventProcessed(auditId).catch((error) => {
      console.error("[payments] webhook audit mark-processed failed", error);
    });
  }

  return { status: 200, body: { received: true } };
}
