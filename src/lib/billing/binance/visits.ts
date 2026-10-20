/**
 * What the Binance Pay payment page records about each visit, and how the admin
 * page reads it back. A visit is one load of the page's instructions: when it
 * opened, when the page last said it was still there, how long it was in front
 * of the learner, where the visitor was, on what device, and whether they copied
 * the Binance ID or the order code. Nothing here is a way to identify a person
 * beyond the account that already owns the order: no IP address, no full user
 * agent, no exact position.
 *
 * Pure and free of server-only imports (the browser code imports it, so nothing
 * here may reach node:crypto: the part that reads the proxy's location headers
 * is in visit-geo.ts).
 */

import { decodeFirstTouch } from "@/lib/analytics/attribution";

export type VisitDevice = "mobile" | "tablet" | "desktop";

/** What the page tells the server a learner did. */
export type VisitAction = "copy_id" | "copy_code" | "guide";
export const VISIT_ACTIONS: readonly VisitAction[] = ["copy_id", "copy_code", "guide"];

/** How often the page says "still here" while it is in front of the learner. */
export const VISIT_BEAT_MS = 30_000;

/** A page that said so this recently is called open right now. */
export const OPEN_NOW_WITHIN_MS = 90_000;

/** The route reads at most this much of a request: a visit report is a few hundred bytes. */
export const MAX_VISIT_BODY_BYTES = 2_048;

/** Page loads one order can record in ten minutes: a reload loop must not fill the table. */
export const MAX_OPENS_PER_ORDER_PER_TEN_MINUTES = 20;

const MAX_SECONDS = 86_400;
const MAX_LEAVES = 1_000;
const MAX_PLACE_LENGTH = 80;

/** One stored visit, in the shape the admin page reads. */
export interface VisitRecord {
  id: string;
  orderId: string;
  openedAt: string;
  lastSeenAt: string;
  visibleSeconds: number;
  leaves: number;
  country: string | null;
  region: string | null;
  city: string | null;
  timeZone: string | null;
  language: string | null;
  device: VisitDevice | null;
  os: string | null;
  browser: string | null;
  source: string | null;
  copiedId: boolean;
  copiedCode: boolean;
  openedGuide: boolean;
}

// ---------------------------------------------------------------------------
// Reading a request
// ---------------------------------------------------------------------------

export interface DeviceInfo {
  device: VisitDevice | null;
  os: string | null;
  browser: string | null;
}

/**
 * A short, human description of the device from its user agent: phone / tablet /
 * computer, the system, and the browser, naming the in-app browsers of the apps
 * a link is often opened from (a payment page opened inside Facebook is a very
 * different experience from one opened in Chrome). The user agent itself is
 * never stored.
 */
export function describeUserAgent(userAgent: string | null | undefined): DeviceInfo {
  const ua = (userAgent ?? "").slice(0, 400);
  if (ua === "") return { device: null, os: null, browser: null };

  let device: VisitDevice = "desktop";
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) device = "tablet";
  else if (/iPhone|iPod|Mobi|Android/i.test(ua)) device = "mobile";

  let os: string | null = null;
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser: string | null = null;
  if (/Instagram/i.test(ua)) browser = "Instagram app";
  else if (/FBAN|FBAV|FB_IAB/.test(ua)) browser = "Facebook app";
  else if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) browser = "TikTok app";
  else if (/Snapchat/i.test(ua)) browser = "Snapchat app";
  else if (/WhatsApp/i.test(ua)) browser = "WhatsApp";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/EdgA|EdgiOS|Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|OPiOS|Opera/i.test(ua)) browser = "Opera";
  else if (/UCBrowser/i.test(ua)) browser = "UC Browser";
  else if (/Firefox|FxiOS/i.test(ua)) browser = "Firefox";
  else if (/; wv\)/.test(ua)) browser = "In-app browser";
  else if (/CriOS|Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua)) browser = "Safari";

  return { device, os, browser };
}

/** A place name from a proxy header: percent-decoded if it was encoded, stripped of control characters and bounded. */
export function cleanPlaceName(value: string | null | undefined): string | null {
  if (!value) return null;
  let text = value;
  try {
    text = decodeURIComponent(value);
  } catch {
    // Not percent-encoded after all: use it as it came.
  }
  const cleaned = text
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, MAX_PLACE_LENGTH);
  return cleaned === "" ? null : cleaned;
}

/** The learner's first-touch source (e.g. facebook), from the cookie the site already sets; null when there is none. */
export function sourceFromCookie(raw: string | null | undefined): string | null {
  return decodeFirstTouch(raw)?.source ?? null;
}

const TIME_ZONE_PATTERN = /^[A-Za-z][A-Za-z0-9_+\-/]{0,63}$/;
const LANGUAGE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/;

/** The browser's time zone name (e.g. Africa/Cairo), or null for anything that is not shaped like one. */
export function sanitizeTimeZone(value: unknown): string | null {
  return typeof value === "string" && TIME_ZONE_PATTERN.test(value) ? value : null;
}

/** The browser's language tag (e.g. ar-EG), or null for anything that is not shaped like one. */
export function sanitizeLanguage(value: unknown): string | null {
  return typeof value === "string" && value.length <= 16 && LANGUAGE_PATTERN.test(value)
    ? value
    : null;
}

/** A whole number from 0 to `max`; anything else is 0. */
function sanitizeCounter(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, Math.round(value)));
}

export function sanitizeVisibleSeconds(value: unknown): number {
  return sanitizeCounter(value, MAX_SECONDS);
}

export function sanitizeLeaves(value: unknown): number {
  return sanitizeCounter(value, MAX_LEAVES);
}

/** Only the three known actions, each once. */
export function sanitizeActions(value: unknown): VisitAction[] {
  if (!Array.isArray(value)) return [];
  return VISIT_ACTIONS.filter((action) => value.includes(action));
}

// ---------------------------------------------------------------------------
// Reading visits back (the admin page)
// ---------------------------------------------------------------------------

/** "45 s", "3 min", "3 min 20 s", "1 h 05 min". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const rest = seconds % 60;
    return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${String(minutes % 60).padStart(2, "0")} min`;
}

/** Seconds between the page opening and it last saying it was there. */
export function stayedSeconds(visit: Pick<VisitRecord, "openedAt" | "lastSeenAt">): number {
  const span = (Date.parse(visit.lastSeenAt) - Date.parse(visit.openedAt)) / 1000;
  return Number.isFinite(span) ? Math.max(0, Math.round(span)) : 0;
}

export function isOpenNow(visit: Pick<VisitRecord, "lastSeenAt">, now: number): boolean {
  return now - Date.parse(visit.lastSeenAt) <= OPEN_NOW_WITHIN_MS;
}

export interface VisitSummary {
  count: number;
  /** Oldest first. */
  visits: VisitRecord[];
  first: VisitRecord;
  last: VisitRecord;
  /** The newest visit is still in front of the learner. */
  openNow: boolean;
  copiedId: boolean;
  copiedCode: boolean;
  openedGuide: boolean;
}

/** One order's visits boiled down; null when the page was never recorded as opened. */
export function summarizeVisits(visits: VisitRecord[], now: number): VisitSummary | null {
  if (visits.length === 0) return null;
  const sorted = [...visits].sort((a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt));
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  return {
    count: sorted.length,
    visits: sorted,
    first,
    last,
    openNow: isOpenNow(last, now),
    copiedId: sorted.some((visit) => visit.copiedId),
    copiedCode: sorted.some((visit) => visit.copiedCode),
    openedGuide: sorted.some((visit) => visit.openedGuide),
  };
}

/** A country's English name from its two-letter code ("iq" -> "Iraq"); the code itself where the browser does not know it. */
export function countryName(code: string): string {
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase()
    );
  } catch {
    return code.toUpperCase();
  }
}

/** "Iraq, Baghdad" / "Iraq" / the browser's time zone when the country is unknown / "Location unknown". */
export function placeLabel(
  visit: Pick<VisitRecord, "country" | "region" | "city" | "timeZone">,
): string {
  const parts: string[] = [];
  if (visit.country) parts.push(countryName(visit.country));
  const locality = visit.city ?? visit.region;
  if (locality) parts.push(locality);
  if (parts.length > 0) return parts.join(", ");
  return visit.timeZone ? `Time zone ${visit.timeZone}` : "Location unknown";
}

const DEVICE_WORD: Record<VisitDevice, string> = {
  mobile: "Phone",
  tablet: "Tablet",
  desktop: "Computer",
};

/** "Phone · Android · Chrome" / "Computer · Windows · Edge" / "Phone · iOS · Facebook app", as far as it is known. */
export function deviceLabel(visit: Pick<VisitRecord, "device" | "os" | "browser">): string {
  const parts = [visit.device ? DEVICE_WORD[visit.device] : null, visit.os, visit.browser].filter(
    (part): part is string => part !== null,
  );
  return parts.length > 0 ? parts.join(" · ") : "Device unknown";
}
