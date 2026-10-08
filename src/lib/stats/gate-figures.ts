import { formatCount } from "@/lib/i18n/format-count";
import type { SupportLocale } from "@/lib/i18n/locales";

import { toGateFigures } from "./content-stats";
import type { GateFigures } from "./content-stats";
import { getContentStats } from "./public-stats";

/**
 * How big the library is, worded for the locked-content card. Counted once an
 * hour (see getContentStats) and never fails: when the count is unavailable or
 * too small to quote, the figures are null and the card says it without numbers.
 */
export async function getGateFigures(locale: SupportLocale | null): Promise<GateFigures> {
  return toGateFigures(await getContentStats(), (value) => formatCount(value, locale));
}
