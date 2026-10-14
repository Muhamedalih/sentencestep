import { timingSafeEqual } from "node:crypto";

/**
 * Whether a request provably came through OUR reverse proxy (Cloudflare), so the
 * headers that proxy adds — the visitor's country, the visitor's real IP — can be
 * believed.
 *
 * Headers like `cf-ipcountry` are only trustworthy when nobody but Cloudflare can
 * set them. Behind Cloudflare the origin server is firewalled to Cloudflare's
 * addresses, and Cloudflare is configured (a Transform Rule) to stamp a secret
 * value into `x-origin-auth` on every request it forwards, replacing whatever the
 * client sent. This function checks that stamp. Without the stamp — a request
 * that reached the server some other way, or a server where no secret is
 * configured — every proxy-supplied header is ignored, exactly as on a host with
 * no proxy at all, so a forged `cf-ipcountry: IQ` can never buy a cheaper price.
 */
export const ORIGIN_AUTH_HEADER = "x-origin-auth";

/** A secret shorter than this is treated as "not configured": a short value is guessable, so it must never unlock trust. */
export const MIN_ORIGIN_SECRET_LENGTH = 24;

function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isViaTrustedProxy(
  headers: { get(name: string): string | null },
  secret: string | null | undefined = process.env.ORIGIN_AUTH_SECRET,
): boolean {
  if (!secret || secret.length < MIN_ORIGIN_SECRET_LENGTH) return false;
  const presented = headers.get(ORIGIN_AUTH_HEADER);
  return presented !== null && constantTimeEqual(presented, secret);
}
