"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { TIMEZONE_COOKIE, TIMEZONE_COOKIE_MAX_AGE } from "@/lib/features/learner-date";

/**
 * Leaves the browser's IANA time zone in a cookie so the server can work out
 * the learner's own calendar date (see localISODateInTimeZone) and render
 * Home's date-keyed cards — quests, daily session, streak strip — in the
 * initial response instead of the browser fetching them after hydration.
 * Renders nothing; only writes when the value actually changed.
 */
export function TimezoneCookie() {
  const router = useRouter();
  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timeZone) return;
      const current = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${TIMEZONE_COOKIE}=`))
        ?.slice(TIMEZONE_COOKIE.length + 1);
      if (current === timeZone) return;
      document.cookie = `${TIMEZONE_COOKIE}=${timeZone}; path=/; max-age=${TIMEZONE_COOKIE_MAX_AGE}; samesite=lax`;
      // A DIFFERENT zone than before (the learner travelled): this page was rendered
      // for the old one, so ask for it again. On the very first visit there was no
      // previous zone and Home already fetches its cards itself, so nothing to redo.
      if (current !== undefined) router.refresh();
    } catch {
      // Cookies blocked or Intl unavailable: Home falls back to fetching the cards itself.
    }
  }, [router]);
  return null;
}
