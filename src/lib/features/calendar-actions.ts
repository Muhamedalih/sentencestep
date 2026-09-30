"use server";

import { fetchActivityRange, fetchFreezeUsage } from "@/lib/features/activity-queries";
import type { ActivityDay } from "@/lib/features/activity-queries";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { daysBetween, freezesRemaining, monthPeriod } from "@/lib/features/streak-freeze";
import { createClient } from "@/lib/supabase/server";

export interface StreakCalendarData {
  days: ActivityDay[];
  freezesRemaining: number;
  monthlyFreezes: number;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** A month view plus its edges — never a request for the learner's whole history. */
const MAX_RANGE_DAYS = 62;

/**
 * The streak calendar's data for one date window plus the learner's
 * remaining freezes this month. Dates are the learner's own local calendar
 * dates, passed in by the client (a Server Action runs in the server's time
 * zone — same rationale as fetchProgressAction's identical parameter).
 * Returns null — rendering nothing — when the feature isn't open to this
 * visitor (the admin switch, preview state, premium-only, or a guest), or
 * when anything about the read fails: this is decoration on the Home page
 * and must never surface an error there.
 */
export async function fetchStreakCalendarAction(
  fromISO: string,
  toISO: string,
  todayISO: string,
): Promise<StreakCalendarData | null> {
  if (![fromISO, toISO, todayISO].every((value) => ISO_DATE.test(value))) return null;
  const span = daysBetween(fromISO, toISO);
  if (span < 0 || span > MAX_RANGE_DAYS) return null;

  try {
    const features = await getEffectiveFeatures();
    if (!features.streakCalendar.enabled) return null;

    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) return null;

    const [days, usage] = await Promise.all([
      fetchActivityRange(userId, fromISO, toISO),
      fetchFreezeUsage(userId),
    ]);
    return {
      days,
      freezesRemaining: freezesRemaining(
        usage,
        monthPeriod(todayISO),
        features.streakCalendar.monthlyFreezes,
      ),
      monthlyFreezes: features.streakCalendar.monthlyFreezes,
    };
  } catch (error) {
    console.error("[features] fetchStreakCalendarAction failed", error);
    return null;
  }
}
