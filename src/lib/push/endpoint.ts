/**
 * Web Push endpoints are chosen by the BROWSER that subscribes, and the server later POSTs to
 * whatever address was saved. A caller who could save any address could make the server send
 * requests to internal addresses (the cloud metadata service, other containers) or to any site.
 * Every real endpoint belongs to the push service of the browser's maker, so only those hosts are
 * accepted, over https, with no credentials and no unusual port.
 */
const PUSH_HOST_SUFFIXES = [
  // Chrome, Edge, Opera, Samsung Internet, Brave (all Firebase Cloud Messaging)
  "fcm.googleapis.com",
  "android.googleapis.com",
  // Firefox
  "push.services.mozilla.com",
  // Safari and every Apple browser
  "push.apple.com",
  // Edge and older Windows browsers (Windows Notification Service)
  "notify.windows.com",
];

export const MAX_ENDPOINT_LENGTH = 2048;

export function isAllowedPushEndpoint(endpoint: unknown): endpoint is string {
  if (
    typeof endpoint !== "string" ||
    endpoint.length === 0 ||
    endpoint.length > MAX_ENDPOINT_LENGTH
  ) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  if (url.username !== "" || url.password !== "") return false;
  if (url.port !== "" && url.port !== "443") return false;

  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

/** The two keys are base64url text of a fixed small size; anything else is not a browser's subscription. */
export function isPlausiblePushKey(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    /^[A-Za-z0-9_-]+={0,2}$/.test(value)
  );
}
