import webpush from "web-push";

import type { PushSubscriptionRecord } from "@/lib/push/subscriptions";

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/** Falls back through EMAIL_FROM_ADDRESS (already a real, deliverable address for this project) rather than inventing a second contact-email env var just for this — see .env.example. */
function resolveVapidSubject(): string {
  const explicit = process.env.VAPID_SUBJECT;
  if (explicit) return explicit;

  const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? "";
  const match = fromAddress.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (match) return `mailto:${match[0]}`;

  return "mailto:support@sentencestep.com";
}

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Web Push is not configured — see .env.example (VAPID keys).");
  }
  webpush.setVapidDetails(resolveVapidSubject(), publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Path opened on click (see public/sw.js's notificationclick handler) — always app-relative, never a full URL, since the service worker resolves it against its own origin. */
  url: string;
}

/** Thrown when the push service reports the endpoint as permanently gone (404/410) — the caller's cue to delete the stale row (see deletePushSubscriptionByEndpoint), same as the browser's own permission-revoked signal. */
export class PushSubscriptionGoneError extends Error {}

export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<void> {
  ensureConfigured();

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({ title: payload.title, body: payload.body, url: payload.url }),
    );
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      throw new PushSubscriptionGoneError(`Push subscription is gone (${statusCode}).`);
    }
    throw error;
  }
}
