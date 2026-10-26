/**
 * The "open in browser" strip. Facebook's and Instagram's built-in browsers cannot sign anyone in with
 * Google (Google refuses its sign-in page inside an embedded browser, and 172 of the latest 200 accounts,
 * on 2026-10-27, were made with Google), cannot ask for notifications and cannot install the site. On the
 * sign-up and sign-in pages the "Continue with Google" button is replaced there by a quiet strip that
 * gets the visitor into their own browser, with the email form right below it.
 *
 * Who gets it is the "Open in browser strip" permission (/admin/permissions): a share of the new visitors
 * who arrive in one of those browsers. The share is cut with a random number from 0 to 99 (the visitor's
 * "bucket") kept in a cookie, so it never changes for a visitor and a bigger share only adds visitors.
 * The bucket travels in the address when the visitor opens the page in another browser, so a sign-up
 * made there is still counted in the same group (USER_SIGNED_UP carries it as `inAppBucket`).
 *
 * Pure and free of window and next imports: the server (the two pages), the browser (the strip) and the
 * tests share it.
 */

import { detectInAppBrowser } from "@/lib/analytics/attribution";
import type { FirstTouch, InAppBrowser } from "@/lib/analytics/attribution";

export const IN_APP_BUCKET_COOKIE = "ss_ias";
export const IN_APP_BUCKET_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** The address parameter that carries a visitor's bucket to the browser they open the page in. */
export const IN_APP_BUCKET_PARAM = "ias";

/**
 * `?in_app_strip=` on the sign-up or sign-in page. `on` shows the strip in a real in-app browser (how
 * to try the real thing from a phone); `facebook-android`, `facebook-ios`, `instagram-android` or
 * `instagram-ios` shows that version in any browser, for an admin to look at.
 */
export const IN_APP_STRIP_PARAM = "in_app_strip";

export type StripPlatform = "android" | "ios" | "other";
export type StripPage = "register" | "login";

export function isInAppBrowserName(value: unknown): value is InAppBrowser {
  return value === "facebook" || value === "instagram";
}

export function isStripPlatform(value: unknown): value is StripPlatform {
  return value === "android" || value === "ios" || value === "other";
}

export function isStripPage(value: unknown): value is StripPage {
  return value === "register" || value === "login";
}

/** What the browser says it runs on. iPhone has no way to open a link in another app from a page, so it gets steps; "other" (a desktop looking at the strip) gets the same. */
export function stripPlatformFrom(userAgent: string | null | undefined): StripPlatform {
  if (!userAgent) return "other";
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  return "other";
}

/** A bucket as stored: a whole number from 0 to 99, nothing else. */
export function parseBucket(value: string | null | undefined): number | null {
  if (!value || !/^\d{1,2}$/.test(value)) return null;
  return Number(value);
}

/** `random` is a number in [0, 1), e.g. Math.random(). */
export function newBucket(random: number): number {
  return Math.min(99, Math.max(0, Math.floor(random * 100)));
}

export interface ForcedStrip {
  /** Null for `on`: whichever in-app browser the visitor is really in. */
  app: InAppBrowser | null;
  platform: StripPlatform | null;
}

const FORCED_VERSION = /^(facebook|instagram)-(android|ios)$/;

export function parseForcedStrip(value: string | null | undefined): ForcedStrip | null {
  if (!value) return null;
  if (value === "on") return { app: null, platform: null };
  const match = FORCED_VERSION.exec(value);
  if (!match) return null;
  return { app: match[1] as InAppBrowser, platform: match[2] as StripPlatform };
}

export interface StripDecision {
  app: InAppBrowser;
  platform: StripPlatform;
  /** Whether this visitor gets the strip: false for the visitors kept as the comparison group. */
  show: boolean;
  /** Pinned by ?in_app_strip= rather than decided by the share. */
  forced: boolean;
  /** The visitor's bucket, or null when this browser has none yet. */
  bucket: number | null;
  /** The share (0 to 100) of visitors given the strip: 0 while the permission is not open to a share. */
  share: number;
}

/**
 * What a visitor to the sign-up or sign-in page gets, or null when nothing here concerns them (not in
 * an in-app browser, and not looking at the strip on purpose). Only a visitor in Facebook's or
 * Instagram's browser can ever be given it, whatever the share.
 */
export function decideStrip(input: {
  userAgent: string | null | undefined;
  forcedParam: string | null | undefined;
  /** getRolloutAccess().inAppStrip: true for an admin, for a browser an admin switched preview on for, or when the setting is open to everyone. */
  access: boolean;
  share: number;
  bucket: number | null;
}): StripDecision | null {
  const detected = detectInAppBrowser(input.userAgent);
  const forced = parseForcedStrip(input.forcedParam);
  const rest = { bucket: input.bucket, share: input.share };

  if (forced) {
    const app = forced.app ?? detected;
    // `on` is the browser the visitor is really in; a named version is for looking at, so it needs the permission (or a real in-app browser).
    if (!app || (forced.app && !detected && !input.access)) return null;
    return {
      app,
      platform: forced.platform ?? stripPlatformFrom(input.userAgent),
      show: true,
      forced: true,
      ...rest,
    };
  }

  if (!detected) return null;
  return {
    app: detected,
    platform: stripPlatformFrom(input.userAgent),
    show: input.bucket !== null && input.share > 0 && input.bucket < input.share,
    forced: false,
    ...rest,
  };
}

/**
 * The Android link that opens `href` in Chrome from inside another app (an "intent" address; the
 * address itself is the fallback if Chrome is missing), or null when `href` is not a web address.
 * Any #fragment is dropped, since the intent's own settings start at the first "#".
 */
export function buildIntentUrl(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const scheme = url.protocol.slice(0, -1);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url.toString())};end`;
}

/**
 * The address to open in the visitor's own browser: this page, without the preview parameter, with the
 * visitor's bucket added (so a sign-up made there is counted in the same group) and with where they
 * came from added as utm tags when the address has none (so it is not filed as "direct").
 */
export function buildExternalUrl(input: {
  href: string;
  bucket: number | null;
  firstTouch: FirstTouch | null;
}): string {
  const url = new URL(input.href);
  url.searchParams.delete(IN_APP_STRIP_PARAM);
  if (input.bucket !== null) url.searchParams.set(IN_APP_BUCKET_PARAM, String(input.bucket));
  const touch = input.firstTouch;
  if (touch && touch.source !== "direct") {
    if (!url.searchParams.has("utm_source")) url.searchParams.set("utm_source", touch.source);
    if (touch.medium && !url.searchParams.has("utm_medium")) {
      url.searchParams.set("utm_medium", touch.medium);
    }
    if (touch.campaign && !url.searchParams.has("utm_campaign")) {
      url.searchParams.set("utm_campaign", touch.campaign);
    }
  }
  return url.toString();
}
