/**
 * The learner's calendar week, as "YYYY-MM-DD" strings (their own days, so no time zone handling of its
 * own is needed).
 */

/** First day of the week by language: Saturday for Arabic, Monday elsewhere (0 = Sunday … 6 = Saturday). */
export function weekStartFor(locale: string): number {
  return locale === "ar" ? 6 : 1;
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** The seven dates of the week that contains `todayISO`, starting on `weekStart`. */
export function weekDates(todayISO: string, weekStart: number): string[] {
  const dayOfWeek = new Date(`${todayISO}T00:00:00Z`).getUTCDay();
  const back = (dayOfWeek - weekStart + 7) % 7;
  const first = addDays(todayISO, -back);
  return Array.from({ length: 7 }, (_unused, index) => addDays(first, index));
}
