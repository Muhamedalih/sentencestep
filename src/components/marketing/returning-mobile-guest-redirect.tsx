"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { readProgress } from "@/lib/progress/store";

/** Matches every other "mobile" cutoff already used across the app (LearnSidebar's tab strip, the lesson screen's tap-to-start gate, …) — a real viewport check, not a user-agent guess, so resizing a desktop window this narrow behaves the same way a phone does. */
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

/**
 * Sends a returning MOBILE guest who has already been through the "get
 * started" flow (readProgress().startingLevel is only ever non-null once
 * StartingLevelOnboarding has run — see setStartingLevel's own doc comment)
 * straight to /learn instead of leaving them on this marketing homepage.
 *
 * Deliberately client-side, not a src/middleware.ts redirect: the signal
 * this reads (startingLevel) lives in this guest's own localStorage, which
 * middleware can never see (it only ever reads cookies/headers) — a real
 * signed-in visitor's equivalent redirect (handleRootRoute) can be a clean
 * server-side one because that state IS a cookie. The trade-off here is a
 * brief flash of this static page before the effect below fires and
 * replaces it — there's no way to skip straight to /learn server-side
 * without that guest-progress cookie exchange existing first.
 *
 * Mobile-only and guest-only by design: this page must stay reachable by an
 * incoming marketing link, on desktop, or for a genuinely first-time visitor
 * on any device — see handleRootRoute's own doc comment for why an
 * authenticated visitor already gets the equivalent treatment everywhere,
 * and why a signed-out visitor otherwise always keeps seeing this page.
 */
export function ReturningMobileGuestRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!window.matchMedia(MOBILE_MEDIA_QUERY).matches) return;
    if (readProgress().startingLevel === null) return;
    router.replace("/learn");
  }, [router]);

  return null;
}
