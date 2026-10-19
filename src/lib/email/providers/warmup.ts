import type { EmailUsageStore } from "@/lib/email/usage";
import { utcDay } from "@/lib/email/usage";

/**
 * How many bulk emails a brand-new sending domain may send per day while mailbox providers get to
 * know it. Starting a new domain at hundreds a day looks like a spammer and gets it flagged, so the
 * daily room grows with the days since the first SES send: 50, 100, 150, 250, 350, then 500.
 */
const SCHEDULE: ReadonlyArray<{ fromDay: number; perDay: number }> = [
  { fromDay: 22, perDay: 500 },
  { fromDay: 15, perDay: 350 },
  { fromDay: 10, perDay: 250 },
  { fromDay: 6, perDay: 150 },
  { fromDay: 3, perDay: 100 },
  { fromDay: 1, perDay: 50 },
];

/** The daily room on day `day` of sending (day 1 is the first day anything was sent through SES). */
export function warmupLimit(day: number): number {
  const step = SCHEDULE.find((s) => day >= s.fromDay);
  return step ? step.perDay : SCHEDULE[SCHEDULE.length - 1]!.perDay;
}

/** Which day of sending `today` is, given the first day SES sent anything (null = nothing sent yet, so today is day 1). Both YYYY-MM-DD. */
export function warmupDay(firstPeriod: string | null, today: string): number {
  if (!firstPeriod) return 1;
  const days = Math.round((Date.parse(today) - Date.parse(firstPeriod)) / 86_400_000);
  return Math.max(days, 0) + 1;
}

/**
 * Today's bulk room through SES. The first sending day is looked up once it exists (it never
 * changes after that) and remembered, so a send costs no extra query.
 */
export function createWarmupBudget(store: EmailUsageStore, now: () => Date = () => new Date()) {
  let first: string | null = null;
  return async function dailyBulkRoom(): Promise<number> {
    if (!first) first = await store.firstPeriod("ses");
    return warmupLimit(warmupDay(first, utcDay(now())));
  };
}
