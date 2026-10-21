import type { SupportLocale } from "@/lib/i18n/locales";

/** The four minute-count templates every language provides, each with `{minutes}` where the number goes. */
export interface MinuteCountForms {
  minuteCountOne: string;
  minuteCountTwo: string;
  minuteCountFew: string;
  minuteCountMany: string;
}

/**
 * "3 minutes" written with the right grammar for the language, the same way formatDayCount does it
 * for days: English, Spanish and Turkish only tell one from more; Arabic has its own forms for one,
 * two, three to ten, and eleven or more.
 */
export function formatMinuteCount(
  forms: MinuteCountForms,
  locale: SupportLocale | null,
  minutes: number,
): string {
  if (locale === "ar") {
    if (minutes === 1) return forms.minuteCountOne;
    if (minutes === 2) return forms.minuteCountTwo;
    const template = minutes >= 3 && minutes <= 10 ? forms.minuteCountFew : forms.minuteCountMany;
    return template.replace("{minutes}", String(minutes));
  }
  return minutes === 1
    ? forms.minuteCountOne
    : forms.minuteCountFew.replace("{minutes}", String(minutes));
}
