/**
 * Where a visitor came from, so the funnel can be read per source (which post,
 * which group) instead of only in total. Two halves:
 *
 *  - The browser leaves a short first-touch cookie on a visitor's first page
 *    (see FirstTouchCookie): the source, and the medium and campaign when the
 *    link carried utm_* tags. It holds nothing personal and nothing about what
 *    the visitor does.
 *  - The server adds it, with the visitor's country and whether they were in
 *    Facebook's or Instagram's built-in browser, to the few funnel events that
 *    are already written (see track.ts), so it costs no extra database call.
 *
 * Pure and free of server-only imports: the browser and the server both use it.
 */

export const ATTRIBUTION_COOKIE = "ss_ft";
export const ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export interface FirstTouch {
  source: string;
  medium: string | null;
  campaign: string | null;
}

export type InAppBrowser = "facebook" | "instagram";

const MAX_TAG_LENGTH = 32;
const TAG_PATTERN = /^[a-z0-9_-]{1,32}$/;

/** A tag is lowercase ASCII letters, digits, "-" and "_" only, so it is safe in a cookie and in a report. Anything else is not a tag. */
export function sanitizeTag(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_TAG_LENGTH)
    .replace(/-+$/g, "");
  return cleaned === "" ? null : cleaned;
}

/** Facebook's and Instagram's built-in browsers announce themselves in the user agent. */
export function detectInAppBrowser(userAgent: string | null | undefined): InAppBrowser | null {
  if (!userAgent) return null;
  if (/Instagram/i.test(userAgent)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/.test(userAgent)) return "facebook";
  return null;
}

/** Hosts (suffix match) and their tag, most common first. */
const REFERRER_HOSTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)(duckduckgo\.com|yahoo\.com|yandex\.[a-z]+)$/, "search-other"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)(t\.me|telegram\.me|telegram\.org)$/, "telegram"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)snapchat\.com$/, "snapchat"],
];

/** Android apps send the app's package as the referrer, e.g. android-app://com.facebook.katana. */
function sourceFromAndroidPackage(pkg: string): string {
  if (pkg === "com.google.android.gm") return "gmail";
  if (pkg.startsWith("com.google.android.googlequicksearchbox")) return "google";
  if (pkg.startsWith("com.facebook.")) return "facebook";
  if (pkg.startsWith("com.instagram.")) return "instagram";
  if (pkg.startsWith("com.whatsapp")) return "whatsapp";
  if (pkg.startsWith("org.telegram.")) return "telegram";
  return "android-app";
}

function isOwnHost(host: string, ownHost: string): boolean {
  const own = ownHost.toLowerCase().replace(/^www\./, "");
  return host === own || host.endsWith(`.${own}`);
}

/**
 * The source named by a referrer, or null when there is none worth recording:
 * no referrer, one that is not a link, the site itself, or Google's own sign-in
 * page (the step after "Continue with Google", never where a visitor came from).
 */
export function sourceFromReferrer(referrer: string, ownHost: string): string | null {
  if (!referrer) return null;
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return null;
  }
  if (url.protocol === "android-app:") return sourceFromAndroidPackage(url.hostname);
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "" || isOwnHost(host, ownHost) || host === "accounts.google.com") return null;
  for (const [pattern, tag] of REFERRER_HOSTS) {
    if (pattern.test(host)) return tag;
  }
  return sanitizeTag(host.replace(/\./g, "-"));
}

/**
 * The first touch for a page load: a link's own utm_source wins (it is how a
 * post or group is named on purpose), then the referrer, then the built-in
 * browser the visitor is in, and "direct" when nothing says.
 */
export function firstTouchFrom(input: {
  search: string;
  referrer: string;
  ownHost: string;
  userAgent: string | null | undefined;
}): FirstTouch {
  const params = new URLSearchParams(input.search);
  const taggedSource = sanitizeTag(params.get("utm_source"));
  const source =
    taggedSource ??
    sourceFromReferrer(input.referrer, input.ownHost) ??
    detectInAppBrowser(input.userAgent) ??
    "direct";
  return {
    source,
    medium: sanitizeTag(params.get("utm_medium")),
    campaign: sanitizeTag(params.get("utm_campaign")),
  };
}

export function encodeFirstTouch(touch: FirstTouch): string {
  return `${touch.source}~${touch.medium ?? ""}~${touch.campaign ?? ""}`;
}

/** Null for anything that is not exactly what encodeFirstTouch writes, since a cookie is client input. */
export function decodeFirstTouch(raw: string | null | undefined): FirstTouch | null {
  if (!raw) return null;
  const parts = raw.split("~");
  if (parts.length !== 3) return null;
  const [source, medium, campaign] = parts as [string, string, string];
  if (!TAG_PATTERN.test(source)) return null;
  if (medium !== "" && !TAG_PATTERN.test(medium)) return null;
  if (campaign !== "" && !TAG_PATTERN.test(campaign)) return null;
  return { source, medium: medium || null, campaign: campaign || null };
}

/**
 * The fields added to a funnel event's properties. Only what is known is
 * included, so an event from a browser without the cookie just has less.
 */
export function attributionProperties(input: {
  cookie: string | null | undefined;
  userAgent: string | null | undefined;
  country: string | null | undefined;
}): Record<string, string> {
  const properties: Record<string, string> = {};
  const touch = decodeFirstTouch(input.cookie);
  if (touch) {
    properties.source = touch.source;
    if (touch.medium) properties.medium = touch.medium;
    if (touch.campaign) properties.campaign = touch.campaign;
  }
  const inApp = detectInAppBrowser(input.userAgent);
  if (inApp) properties.inApp = inApp;
  if (input.country && /^[a-z]{2}$/.test(input.country)) properties.country = input.country;
  return properties;
}
