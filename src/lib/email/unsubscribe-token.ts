import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * The link in every nudge email that stops them in one click. It carries the learner's id and a
 * signature only this server can make (HMAC-SHA256 with a key derived from the service-role key,
 * which is secret and already on the server), so nobody can unsubscribe somebody else by guessing a
 * link, and no database table of tokens is needed. It does not expire: an unsubscribe link in an old
 * email has to keep working.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUserId(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID.test(value);
}

function key(secret: string): Buffer {
  return createHash("sha256").update(`unsubscribe-v1:${secret}`).digest();
}

export function unsubscribeToken(userId: string, secret: string): string {
  return createHmac("sha256", key(secret)).update(userId.toLowerCase()).digest("base64url");
}

export function verifyUnsubscribeToken(
  userId: string | null | undefined,
  token: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !isUserId(userId) || !token) return false;
  const expected = Buffer.from(unsubscribeToken(userId, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** The query string of an unsubscribe link. */
export function unsubscribeQuery(userId: string, secret: string): string {
  return `u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId, secret)}`;
}

/** The links and headers of one learner's emails; null when the server has no secret to sign with. */
export function unsubscribeLinks(
  origin: string,
  userId: string,
  secret: string | undefined,
): { pageUrl: string; headers: Record<string, string> } | null {
  if (!secret) return null;
  const query = unsubscribeQuery(userId, secret);
  return {
    pageUrl: `${origin}/unsubscribe?${query}`,
    // RFC 8058: mail apps show their own "Unsubscribe" button and POST to this address, no page needed.
    headers: {
      "List-Unsubscribe": `<${origin}/api/email/unsubscribe?${query}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
