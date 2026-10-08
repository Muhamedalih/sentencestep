"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Event handlers that warm a route the moment the learner shows intent to open
 * it — pointer over it, finger down on it, keyboard focus on it — for a <Link>
 * that has `prefetch={false}`. Next's own Link only prefetches on hover/touch
 * when its `prefetch` prop is NOT false, so those links (every sidebar, tab and
 * lesson-card Link here, kept off the default prefetch because each one costs
 * a serverless function run) otherwise never react to intent at all. A
 * finger-down warms
 * the route a few tens of milliseconds before the click is delivered, and
 * router.prefetch() is a no-op for a route that is already warm or in flight,
 * so calling this on every hover costs nothing.
 */
export function useIntentPrefetch(href: string) {
  const router = useRouter();
  const warm = useCallback(() => router.prefetch(href), [router, href]);
  return { onPointerEnter: warm, onTouchStart: warm, onFocus: warm };
}
