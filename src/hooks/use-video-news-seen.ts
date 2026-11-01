"use client";

import { useCallback, useSyncExternalStore } from "react";

import { documentCookieHasVideoNewsSeen, videoNewsCookie } from "@/lib/video-dictation/news";

const listeners = new Set<() => void>();
/** Read once from the cookie, then kept here, so every piece of the page (the line on Home, the tag on the menu item) hides at the same moment. */
let cached: boolean | null = null;

function readSeen(): boolean {
  if (cached === null) {
    try {
      cached = documentCookieHasVideoNewsSeen(document.cookie);
    } catch {
      cached = false;
    }
  }
  return cached;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Whether the learner has already closed the «جديد» line or opened the Video section on this browser,
 * and a function that records it (see lib/video-dictation/news.ts for why it is a cookie). The server
 * only draws the line and the tag for a learner whose cookie is missing, so the server snapshot is
 * "not seen" and nothing mismatches; this hook only makes them leave at once when the learner
 * closes the line or opens the section in the same visit.
 */
export function useVideoNewsSeen() {
  const seen = useSyncExternalStore(subscribe, readSeen, () => false);
  const markSeen = useCallback(() => {
    if (readSeen()) return;
    cached = true;
    try {
      document.cookie = videoNewsCookie(window.location.protocol === "https:");
    } catch {
      // The line is a convenience only: worst case it comes back on the next visit.
    }
    for (const listener of listeners) listener();
  }, []);
  return { seen, markSeen };
}
