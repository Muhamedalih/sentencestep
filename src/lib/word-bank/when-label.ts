import type { SupportLocale } from "@/lib/i18n/locales";
import { firstMet } from "@/lib/word-bank/round";

/** The four wordings of a "when" (see the dictionary's myWords.when*). */
export interface WhenCopy {
  whenToday: string;
  whenYesterday: string;
  /** "{weekday}" */
  whenLastWeekday: string;
  /** "{date}" */
  whenOnDate: string;
}

/** The locale the browser's date formatting is asked for: Arabic with Western digits, like the rest of the site. */
function intlLocale(locale: SupportLocale | null): string {
  return locale === "ar" ? "ar-u-nu-latn" : (locale ?? "en");
}

/**
 * When a word was first met, as a few words for the "home sentence" card: "today", "yesterday",
 * "last Sunday" (a day within the last week) or "on October 24" (a week or more ago) — written in the
 * learner's own language, on their own calendar days.
 */
export function firstMetLabel(
  firstSeenOn: string,
  todayISO: string,
  locale: SupportLocale | null,
  copy: WhenCopy,
): string {
  const met = firstMet(firstSeenOn, todayISO);
  switch (met.kind) {
    case "today":
      return copy.whenToday;
    case "yesterday":
      return copy.whenYesterday;
    case "weekday": {
      // 2024-01-07 was a Sunday: the day-of-week number counts from there.
      const name = new Intl.DateTimeFormat(intlLocale(locale), {
        weekday: "long",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2024, 0, 7 + met.weekday)));
      const written = locale === "es" || locale === "tr" ? name.toLocaleLowerCase(locale) : name;
      return copy.whenLastWeekday.replace("{weekday}", written);
    }
    case "date": {
      const date = new Intl.DateTimeFormat(intlLocale(locale), {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${firstSeenOn}T00:00:00Z`));
      return copy.whenOnDate.replace("{date}", date);
    }
  }
}
