import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * The relay (a small server in Frankfurt that reads the shop's Binance Pay
 * history) talks to /api/payments/binance/* with a signed request. The
 * signature covers the timestamp, the method, the path and a hash of the body,
 * so a captured request can neither be replayed later nor re-aimed at another
 * endpoint. The poller on the relay (deploy/relay/poller.py) computes the same
 * string; change one and the other has to change with it.
 */
export const RELAY_TIMESTAMP_HEADER = "x-relay-timestamp";
export const RELAY_SIGNATURE_HEADER = "x-relay-signature";

/** A signed request is only good for this long either side of the server's clock. */
export const RELAY_MAX_SKEW_MS = 120_000;

interface HeadersLike {
  get(name: string): string | null;
}

function signedString(timestamp: string, method: string, path: string, body: string): string {
  const bodyHash = createHash("sha256").update(body).digest("hex");
  return `${timestamp}\n${method.toUpperCase()}\n${path}\n${bodyHash}`;
}

export function signRelayRequest(
  secret: string,
  timestampMs: number,
  method: string,
  path: string,
  body: string,
): string {
  return createHmac("sha256", secret)
    .update(signedString(String(timestampMs), method, path, body))
    .digest("hex");
}

export type RelayAuthResult =
  { ok: true } | { ok: false; reason: "missing_headers" | "stale_timestamp" | "bad_signature" };

export function verifyRelayRequest(input: {
  secret: string;
  method: string;
  path: string;
  body: string;
  headers: HeadersLike;
  /** The server's clock, in milliseconds. */
  now: number;
}): RelayAuthResult {
  const timestamp = input.headers.get(RELAY_TIMESTAMP_HEADER)?.trim() ?? "";
  const presented = input.headers.get(RELAY_SIGNATURE_HEADER)?.trim().toLowerCase() ?? "";
  if (!/^\d{10,14}$/.test(timestamp) || !/^[0-9a-f]{64}$/.test(presented)) {
    return { ok: false, reason: "missing_headers" };
  }
  if (Math.abs(input.now - Number(timestamp)) > RELAY_MAX_SKEW_MS) {
    return { ok: false, reason: "stale_timestamp" };
  }

  const expected = createHmac("sha256", input.secret)
    .update(signedString(timestamp, input.method, input.path, input.body))
    .digest();
  const given = Buffer.from(presented, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "bad_signature" };
  }
  return { ok: true };
}
