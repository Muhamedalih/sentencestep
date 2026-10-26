import { ATTRIBUTION_COOKIE, decodeFirstTouch } from "@/lib/analytics/attribution";
import type { FirstTouch } from "@/lib/analytics/attribution";
import {
  IN_APP_BUCKET_COOKIE,
  IN_APP_BUCKET_COOKIE_MAX_AGE,
  parseBucket,
} from "@/lib/in-app-strip/strip";

/** The browser half of the open in browser strip (cookies and the clipboard). Browser only. */

function readCookie(name: string): string | undefined {
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  return entry?.slice(name.length + 1);
}

/** The bucket this browser already has, or null. */
export function readBucketCookie(): number | null {
  return parseBucket(readCookie(IN_APP_BUCKET_COOKIE));
}

export function writeBucketCookie(bucket: number): void {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${IN_APP_BUCKET_COOKIE}=${bucket}; path=/; max-age=${IN_APP_BUCKET_COOKIE_MAX_AGE}; samesite=lax${secure}`;
}

/** Where the visitor first came from (see FirstTouchCookie), or null. */
export function readFirstTouchCookie(): FirstTouch | null {
  return decodeFirstTouch(readCookie(ATTRIBUTION_COOKIE));
}

/** Copies `text`; false when the browser refuses (some in-app browsers block the clipboard even after a tap). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Try the older way below.
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, text.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(field);
    return copied;
  } catch {
    return false;
  }
}
