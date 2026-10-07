import type { SupportLocale } from "@/lib/i18n/locales";

/** The four day-count templates every language provides, each with `{days}` where the number goes. */
export interface DayCountForms {
  dayCountOne: string;
  dayCountTwo: string;
  dayCountFew: string;
  dayCountMany: string;
}

/**
 * "7 days" written with the right grammar for the language: a visitor with no
 * support language (English), Spanish and Turkish only distinguish one from
 * more; Arabic has its own forms for one, two, three to ten, and eleven or more.
 */
export function formatDayCount(
  forms: DayCountForms,
  locale: SupportLocale | null,
  days: number,
): string {
  if (locale === "ar") {
    if (days === 1) return forms.dayCountOne;
    if (days === 2) return forms.dayCountTwo;
    const template = days >= 3 && days <= 10 ? forms.dayCountFew : forms.dayCountMany;
    return template.replace("{days}", String(days));
  }
  return days === 1 ? forms.dayCountOne : forms.dayCountFew.replace("{days}", String(days));
}
