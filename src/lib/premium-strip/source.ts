import { firstParam } from "@/lib/billing/after-payment";

/**
 * How a press on Home's Premium strip is counted. The strip's button is a plain link, so the press is
 * counted where it lands: the link carries one fixed word, and the plans page and the upgrade pop-up
 * both write it on their UPGRADE_VIEWED event. No extra write is made, and a visitor without an account
 * is counted too.
 */
export const STRIP_SOURCE = "home_strip";
export const STRIP_UPGRADE_HREF = `/upgrade?src=${STRIP_SOURCE}`;

/** `{ src }` for a plans-page address opened by the strip, otherwise nothing (any other word is never stored). */
export function parseStripSource(src: string | string[] | undefined): {
  src?: typeof STRIP_SOURCE;
} {
  return firstParam(src) === STRIP_SOURCE ? { src: STRIP_SOURCE } : {};
}
