"use client";

import { useEffect } from "react";

import { detectInAppBrowser } from "@/lib/analytics/attribution";
import { readBucketCookie, writeBucketCookie } from "@/lib/in-app-strip/browser";
import { IN_APP_BUCKET_PARAM, newBucket, parseBucket } from "@/lib/in-app-strip/strip";

/**
 * Gives a visitor who arrives in Facebook's or Instagram's built-in browser a random number from 0 to
 * 99, once (see strip.ts: it is what the open in browser strip's share is cut with), and keeps the
 * number a visitor brings in the address when they open the page in their own browser from the strip,
 * so a sign-up made there is still counted in the same group. It writes only when there is no such
 * cookie yet, makes no request, and renders nothing; if cookies are blocked the visitor sees no
 * difference.
 */
export function InAppBucketCookie() {
  useEffect(() => {
    try {
      if (readBucketCookie() !== null) return;
      const carried = parseBucket(
        new URLSearchParams(window.location.search).get(IN_APP_BUCKET_PARAM),
      );
      if (carried !== null) {
        writeBucketCookie(carried);
        return;
      }
      if (detectInAppBrowser(navigator.userAgent)) writeBucketCookie(newBucket(Math.random()));
    } catch {
      // Cookies blocked: nothing is recorded and nothing else is affected.
    }
  }, []);
  return null;
}
