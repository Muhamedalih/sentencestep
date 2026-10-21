/**
 * The seven dots on Today: one per day of the learner's calendar week, lit when they finished a
 * lesson or a session that day. Pure and string-based ("YYYY-MM-DD", the learner's own days), so
 * it needs no time zone handling of its own.
 */

export interface WeekDot {
  /** "YYYY-MM-DD" of the day. */
  date: string;
  /** Short weekday initial in the page language. */
  label: string;
  on: boolean;
  today: boolean;
}

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

export function weekDots(
  activeDays: ReadonlySet<string>,
  todayISO: string,
  weekStart: number,
  labelFor: (iso: string) => string,
): WeekDot[] {
  return weekDates(todayISO, weekStart).map((date) => ({
    date,
    label: labelFor(date),
    // Today counts as soon as it is in the set; a day after today can never be lit.
    on: date <= todayISO && activeDays.has(date),
    today: date === todayISO,
  }));
}

/** Short weekday initial of a "YYYY-MM-DD" date in `locale` (the date is read as UTC, so the zone cannot move the day). */
export function weekdayInitial(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(
      new Date(`${iso}T00:00:00Z`),
    );
  } catch {
    return "";
  }
}
