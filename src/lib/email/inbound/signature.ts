import { createHmac, timingSafeEqual } from "node:crypto";

/** How far a webhook's timestamp may drift from now before it is rejected as a replay. */
export const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export interface WebhookSignatureInput {
  /** The raw request body, exactly as received — never a re-serialised JSON.parse result. */
  body: string;
  id: string | null;
  timestamp: string | null;
  signature: string | null;
  /** The signing secret from the provider's dashboard, "whsec_…" (base64 after the prefix). */
  secret: string;
  /** Injectable clock (ms) for tests. */
  now?: number;
}

/**
 * Verifies a Svix-signed webhook — the scheme Resend uses (svix-id,
 * svix-timestamp, svix-signature headers). Implemented with node:crypto
 * rather than the `svix` package: it is one HMAC, and a dependency would be
 * more surface than the logic. The signed content is `${id}.${timestamp}.${body}`,
 * HMAC-SHA256'd with the base64-decoded secret; the header carries one or
 * more space-separated `v1,<base64>` signatures (several during a secret
 * rotation), and any one matching is enough. Compared in constant time, and
 * stale timestamps are rejected so a captured request can't be replayed.
 */
export function verifyWebhookSignature({
  body,
  id,
  timestamp,
  signature,
  secret,
  now = Date.now(),
}: WebhookSignatureInput): boolean {
  if (!id || !timestamp || !signature || !secret) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(now / 1000 - timestampSeconds) > WEBHOOK_TOLERANCE_SECONDS) return false;

  const key = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret,
    "base64",
  );
  if (key.length === 0) return false;

  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();

  for (const candidate of signature.split(" ")) {
    const [version, value] = candidate.split(",");
    if (version !== "v1" || !value) continue;
    const actual = Buffer.from(value, "base64");
    if (actual.length === expected.length && timingSafeEqual(actual, expected)) return true;
  }
  return false;
}
