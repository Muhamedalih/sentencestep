/**
 * The pure part of Admin > German (the counter of visitors who chose German, permission germanTrack):
 * turning the rows the queries read into the figures the page shows. Days are Baghdad days (UTC+3),
 * like the rest of the admin.
 */

export interface GermanChoiceRow {
  user_id: string | null;
  created_at: string;
  /** The GERMAN_CHOSEN event's properties: `via` and, for a browser that had one, `visitor`. */
  event_properties: unknown;
}

export interface GermanChoicesSummary {
  /** Every switch to German (one learner who flips back and forth leaves several). */
  switches: number;
  /** Different people: an account, else the browser's token, else the row itself. */
  people: number;
  /** People whose first switch was today / in the last 7 days (Baghdad days, today included). */
  peopleToday: number;
  peopleLast7Days: number;
  /** People whose first switch was the first-run step (a brand-new visitor) vs any later switch. */
  firstRunPeople: number;
  laterPeople: number;
  /** New people per Baghdad day, oldest first, the last `days` days ending today. */
  perDay: { day: string; people: number }[];
}

const BAGHDAD_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The Baghdad calendar day ("2026-11-26") of an instant. */
export function baghdadDay(time: Date | string | number): string {
  return new Date(new Date(time).getTime() + BAGHDAD_OFFSET_MS).toISOString().slice(0, 10);
}

function viaOf(properties: unknown): "first_run" | "switch" {
  if (properties && typeof properties === "object" && "via" in properties) {
    return (properties as { via?: unknown }).via === "first_run" ? "first_run" : "switch";
  }
  return "switch";
}

function visitorOf(properties: unknown): string | null {
  if (properties && typeof properties === "object" && "visitor" in properties) {
    const value = (properties as { visitor?: unknown }).visitor;
    return typeof value === "string" && value ? value : null;
  }
  return null;
}

/** Who a row counts as: the account when signed in, else the browser's token, else just that row. */
function personKey(row: GermanChoiceRow, index: number): string {
  if (row.user_id) return `u:${row.user_id}`;
  const visitor = visitorOf(row.event_properties);
  return visitor ? `v:${visitor}` : `r:${index}`;
}

export function summarizeGermanChoices(
  rows: readonly GermanChoiceRow[],
  now: Date = new Date(),
  days = 14,
): GermanChoicesSummary {
  const ordered = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const first = new Map<string, { day: string; via: "first_run" | "switch" }>();
  ordered.forEach((row, index) => {
    const key = personKey(row, index);
    if (!first.has(key)) {
      first.set(key, { day: baghdadDay(row.created_at), via: viaOf(row.event_properties) });
    }
  });

  const today = baghdadDay(now);
  const weekStart = baghdadDay(now.getTime() - 6 * DAY_MS);
  const perDayMap = new Map<string, number>();
  let peopleToday = 0;
  let peopleLast7Days = 0;
  let firstRunPeople = 0;
  for (const { day, via } of first.values()) {
    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);
    if (day === today) peopleToday++;
    if (day >= weekStart && day <= today) peopleLast7Days++;
    if (via === "first_run") firstRunPeople++;
  }

  const perDay: GermanChoicesSummary["perDay"] = [];
  for (let back = days - 1; back >= 0; back--) {
    const day = baghdadDay(now.getTime() - back * DAY_MS);
    perDay.push({ day, people: perDayMap.get(day) ?? 0 });
  }

  return {
    switches: rows.length,
    people: first.size,
    peopleToday,
    peopleLast7Days,
    firstRunPeople,
    laterPeople: first.size - firstRunPeople,
    perDay,
  };
}

export interface GermanLessonEventRow {
  user_id: string | null;
  event_name: string;
}

export interface GermanActivitySummary {
  started: number;
  finished: number;
  /** Different signed-in learners who started / finished at least one (guests have no account to count). */
  membersStarted: number;
  membersFinished: number;
  /** Rows from visitors without an account. */
  guestStarted: number;
  guestFinished: number;
}

const STARTED = new Set(["LESSON_STARTED", "STORY_STARTED", "CONVERSATION_STARTED"]);
const FINISHED = new Set(["LESSON_COMPLETED", "STORY_COMPLETED", "CONVERSATION_COMPLETED"]);

export function summarizeGermanActivity(
  rows: readonly GermanLessonEventRow[],
): GermanActivitySummary {
  const startedBy = new Set<string>();
  const finishedBy = new Set<string>();
  const summary: GermanActivitySummary = {
    started: 0,
    finished: 0,
    membersStarted: 0,
    membersFinished: 0,
    guestStarted: 0,
    guestFinished: 0,
  };
  for (const row of rows) {
    if (STARTED.has(row.event_name)) {
      summary.started++;
      if (row.user_id) startedBy.add(row.user_id);
      else summary.guestStarted++;
    } else if (FINISHED.has(row.event_name)) {
      summary.finished++;
      if (row.user_id) finishedBy.add(row.user_id);
      else summary.guestFinished++;
    }
  }
  summary.membersStarted = startedBy.size;
  summary.membersFinished = finishedBy.size;
  return summary;
}
