"use client";

import { useEffect } from "react";

import {
  VISITOR_TOKEN_COOKIE,
  VISITOR_TOKEN_MAX_AGE,
  newVisitorToken,
  parseVisitorToken,
} from "@/lib/opener/shared";

/**
 * Gives a browser a random token, once (see src/lib/opener/shared.ts): it is what the opening-lesson
 * tests cut "a share of new visitors" with, so a visitor is in the same group every time and a bigger
 * share only adds visitors. It writes only when there is no such cookie yet, makes no request, reads
 * nothing from the server (the static pages stay static) and renders nothing; if cookies are blocked
 * the visitor simply sees the ordinary opening lesson.
 */
export function VisitorTokenCookie() {
  useEffect(() => {
    try {
      const existing = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${VISITOR_TOKEN_COOKIE}=`))
        ?.slice(VISITOR_TOKEN_COOKIE.length + 1);
      if (parseVisitorToken(existing)) return;
      const secure = window.location.protocol === "https:" ? "; secure" : "";
      document.cookie = `${VISITOR_TOKEN_COOKIE}=${newVisitorToken(Math.random)}; path=/; max-age=${VISITOR_TOKEN_MAX_AGE}; samesite=lax${secure}`;
    } catch {
      // Cookies blocked: nothing is recorded and nothing else is affected.
    }
  }, []);
  return null;
}
