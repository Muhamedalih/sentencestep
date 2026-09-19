/**
 * Browser-only Web Push helpers backing the "Enable notifications" toggle
 * (src/components/settings/push-notifications-form.tsx). No PWA/next-pwa
 * plugin in this project — a plain hand-written service worker
 * (public/sw.js) registered on demand, only once the learner actually opts
 * in, rather than on every page load for every visitor.
 */

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** The Push API wants the VAPID public key as a Uint8Array, but env vars/HTML can only carry the base64url string web-push's CLI prints — this is the standard conversion (unchanged across every Web Push tutorial/spec example). */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/** Registers the service worker (idempotent — the browser reuses an existing registration at the same scope/script URL) and subscribes, prompting for permission if not already granted/denied. Throws on denial or on any Push API failure; the caller decides how to surface that. */
export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscriptionJSON> {
  if (!isPushSupported()) {
    throw new Error("Push notifications aren't supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied" ? "denied" : "dismissed");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    // TS's DOM lib types Uint8Array as generic over ArrayBufferLike (which
    // also covers SharedArrayBuffer) while BufferSource wants a concrete
    // ArrayBuffer specifically — the value itself is exactly what every
    // Push API implementation expects, so this is a type-only mismatch.
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  });

  return subscription.toJSON();
}

/** Unsubscribes the browser's own push subscription (revokes it with the push service) — the server-side row still needs its own delete call (see deletePushSubscriptionAction) since this only affects the client. */
export async function unsubscribeFromPush(): Promise<string | null> {
  const subscription = await getExistingPushSubscription();
  if (!subscription) return null;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
}
