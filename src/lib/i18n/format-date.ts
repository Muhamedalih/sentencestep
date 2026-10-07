import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The Intl tag for each interface language. Arabic keeps Latin digits, like
 * every other number in the interface. Written as a Record so adding a
 * locale fails to compile here instead of silently falling back.
 */
const INTL_TAG: Record<SupportLocale, string> = {
  ar: "ar-u-nu-latn",
  es: "es",
  tr: "tr",
};

/**
 * A date written with the month's name ("4 November 2026"), so it reads the
 * same to someone who expects day/month and someone who expects month/day;
 * a bare "11/4/2026" is 11 April to one and 4 November to the other. A
 * visitor with no support language (English) gets the English form. The
 * language and time zone are fixed, never the machine's, so a server render
 * and the browser's hydration of it agree.
 */
export function formatLongDate(
  value: string | number | Date,
  locale: SupportLocale | null | undefined,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(locale ? INTL_TAG[locale] : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
