import type { SupportLocale } from "@/lib/i18n/locales";

/** Same tags as formatLongDate: Arabic keeps Latin digits like every other number in the interface. */
const INTL_TAG: Record<SupportLocale, string> = {
  ar: "ar-u-nu-latn",
  es: "es",
  tr: "tr",
};

/** A whole number with the language's thousands separator ("5,200", "5.200"), fixed so server and browser agree. */
export function formatCount(value: number, locale: SupportLocale | null | undefined): string {
  return new Intl.NumberFormat(locale ? INTL_TAG[locale] : "en", {
    maximumFractionDigits: 0,
  }).format(value);
}
