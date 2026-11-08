"use client";

import { useEffect } from "react";

import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_COOKIE_MAX_AGE,
  encodeFirstTouch,
  firstTouchFrom,
  isTikTokBrowser,
} from "@/lib/analytics/attribution";

/**
 * Remembers, once, which link a visitor arrived from (see attribution.ts) so
 * a later signup or purchase can be traced back to the post or group that
 * brought them. It writes only when there is no such cookie yet, so it costs
 * nothing after the first page, and it makes no request of its own. Renders
 * nothing; if cookies are blocked the visitor sees no difference.
 *
 * It also gives every page opened inside TikTok's built-in browser the
 * Microsoft Clarity custom tag `inApp` = `tiktok`. That browser usually sends
 * no referrer, so Clarity files those visits under "Direct" and has no TikTok
 * browser of its own; with the tag, all visitors from TikTok can be counted
 * (Filters / Custom filters / Custom tags: inApp = tiktok), not only those
 * who sign up. It runs on each full page load, so every page of such a visit
 * carries the tag, and it talks only to Clarity: no Supabase or server load.
 */
export function FirstTouchCookie() {
  useEffect(() => {
    try {
      if (isTikTokBrowser(navigator.userAgent)) {
        const clarity = (window as unknown as { clarity?: (...params: string[]) => void }).clarity;
        if (typeof clarity === "function") clarity("set", "inApp", "tiktok");
      }
    } catch {
      // Clarity missing or blocked: nothing else is affected.
    }
    try {
      const present = document.cookie
        .split("; ")
        .some((entry) => entry.startsWith(`${ATTRIBUTION_COOKIE}=`));
      if (present) return;
      const touch = firstTouchFrom({
        search: window.location.search,
        referrer: document.referrer,
        ownHost: window.location.hostname,
        userAgent: navigator.userAgent,
      });
      const secure = window.location.protocol === "https:" ? "; secure" : "";
      document.cookie = `${ATTRIBUTION_COOKIE}=${encodeFirstTouch(touch)}; path=/; max-age=${ATTRIBUTION_COOKIE_MAX_AGE}; samesite=lax${secure}`;
    } catch {
      // Cookies blocked: nothing is recorded and nothing else is affected.
    }
  }, []);
  return null;
}
