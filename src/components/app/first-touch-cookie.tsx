"use client";

import { useEffect } from "react";

import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_COOKIE_MAX_AGE,
  encodeFirstTouch,
  firstTouchFrom,
} from "@/lib/analytics/attribution";

/**
 * Remembers, once, which link a visitor arrived from (see attribution.ts) so
 * a later signup or purchase can be traced back to the post or group that
 * brought them. It writes only when there is no such cookie yet, so it costs
 * nothing after the first page, and it makes no request of its own. Renders
 * nothing; if cookies are blocked the visitor sees no difference.
 */
export function FirstTouchCookie() {
  useEffect(() => {
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
