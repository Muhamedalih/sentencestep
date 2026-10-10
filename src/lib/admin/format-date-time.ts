/**
 * The time zone the admin pages show times in. The server runs in UTC, so a bare
 * toLocaleString() printed UTC times: three hours behind the Google Sheet the
 * ratings used to be kept in, and behind the clock of everyone who runs the site.
 * Iraq has no daylight saving, so a fixed zone is always right.
 */
export const ADMIN_TIME_ZONE = "Asia/Baghdad";

/** "Oct 10, 2026, 11:56 AM" — a moment, as it reads on a clock in Baghdad. */
export function formatAdminDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ADMIN_TIME_ZONE,
  });
}
