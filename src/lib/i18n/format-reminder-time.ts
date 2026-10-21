import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * A reminder hour (0-23) as the learner reads a clock: Arabic and English on a 12-hour clock with
 * their own morning/evening marker ("8:00 م", "8:00 PM"), Spanish and Turkish on a 24-hour one
 * ("20:00"). A visitor with no support language (English) gets the English form.
 */
export function formatReminderTime(hour: number, locale: SupportLocale | null): string {
  if (locale === "es" || locale === "tr") return `${String(hour).padStart(2, "0")}:00`;
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  const evening = hour >= 12;
  const marker = locale === "ar" ? (evening ? "م" : "ص") : evening ? "PM" : "AM";
  return `${twelve}:00 ${marker}`;
}
