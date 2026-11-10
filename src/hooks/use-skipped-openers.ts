"use client";

import { useLayoutEffect, useState } from "react";

import {
  OPENER_SKIP_COOKIE,
  OPENER_SKIP_MAX_AGE,
  parseSkippedOpeners,
  withSkippedOpener,
} from "@/lib/opener/shared";

function readCookieValue(): string | undefined {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${OPENER_SKIP_COOKIE}=`))
    ?.slice(OPENER_SKIP_COOKIE.length + 1);
}

/** The opening lessons this browser has skipped (see OPENER_SKIP_COOKIE), as lesson ids. Browser only. */
export function readSkippedOpeners(): string[] {
  try {
    return parseSkippedOpeners(readCookieValue());
  } catch {
    return [];
  }
}

/** Remembers that `lessonId` (an opening lesson) was skipped in this browser, so it is never recommended again. A skip is not a completion: nothing else is written. Browser only. */
export function rememberSkippedOpener(lessonId: string): void {
  try {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${OPENER_SKIP_COOKIE}=${withSkippedOpener(readCookieValue(), lessonId)}; path=/; max-age=${OPENER_SKIP_MAX_AGE}; samesite=lax${secure}`;
  } catch {
    // Cookies blocked: the lesson is simply offered again, and can be skipped again.
  }
}

/** A stable empty array for the common visitor who skipped nothing. */
const NONE: string[] = [];

/**
 * The opening lessons this browser has skipped, for the next-lesson pick (see findCurrentLesson).
 * Empty on the server and on the very first render, then read before the browser paints (a layout
 * effect), so Home never shows the skipped opening lesson for a frame first.
 */
export function useSkippedOpeners(): string[] {
  const [skipped, setSkipped] = useState<string[]>(NONE);
  useLayoutEffect(() => {
    const read = readSkippedOpeners();
    if (read.length > 0) setSkipped(read);
  }, []);
  return skipped;
}
