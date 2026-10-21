import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * "Preview in this browser" on the Permissions page: an admin switches every feature on for ONE
 * browser, signed in or not — how a guest-facing screen (the finish screen a guest sees after a first
 * lesson, say) is checked before it is given to anyone. It is a cookie carrying an expiry and a
 * signature made with a server secret, so only an admin's request to the Permissions page can create
 * one; a hand-made cookie is rejected. Server only (node:crypto).
 */
export const ROLLOUT_PREVIEW_COOKIE = "ss_rollout_preview";
export const ROLLOUT_PREVIEW_DAYS = 7;

function previewKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key) return key;
  // No Supabase project linked (a local run): a fixed development key, never used in production.
  return process.env.NODE_ENV !== "production" ? "development-preview-key" : null;
}

function signature(expiresAt: number, key: string): string {
  return createHmac("sha256", key).update(`rollout-preview:${expiresAt}`).digest("hex");
}

/** The cookie value for a preview that runs out at `expiresAt` (milliseconds since the epoch), or null when there is no key to sign with. */
export function signRolloutPreview(expiresAt: number): string | null {
  const key = previewKey();
  return key ? `${expiresAt}.${signature(expiresAt, key)}` : null;
}

/** Whether a cookie value is one we signed and has not run out. */
export function verifyRolloutPreview(value: string | null | undefined, now: number): boolean {
  const key = previewKey();
  if (!key || !value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const expiresAt = Number(value.slice(0, dot));
  if (!Number.isInteger(expiresAt) || expiresAt <= now) return false;
  const given = Buffer.from(value.slice(dot + 1), "hex");
  const expected = Buffer.from(signature(expiresAt, key), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
