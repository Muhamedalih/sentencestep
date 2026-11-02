"use server";

import { cookies } from "next/headers";

import { track } from "@/lib/analytics/track";
import { hasPremiumAccess } from "@/lib/billing/access";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

import {
  HISTORY_MS,
  isUpgradeMoment,
  momentBlock,
  pickMoment,
  storiesFinishedOn,
  weekFigures,
} from "./rules";
import type { UpgradeMoment } from "./rules";

/** What a card is drawn with: which moment, and the learner's own week. */
export interface ClaimedMoment {
  moment: UpgradeMoment;
  lessons: number;
  stories: number;
  streak: number;
}

/**
 * Whether one of the listed cards may be shown to the signed-in learner now and, if so, which one;
 * it records that it was shown (GATE_MOMENT_SHOWN), which is what the once-a-day rule counts. Anything
 * that cannot be read answers null: a card is never shown on a guess. The rules are in rules.ts.
 */
export async function claimUpgradeMoment(
  candidates: readonly UpgradeMoment[],
  storyId?: string,
): Promise<ClaimedMoment | null> {
  const listed = candidates.filter(isUpgradeMoment).slice(0, 3);
  if (listed.length === 0) return null;
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const [features, premium, cookieStore] = await Promise.all([
      getEffectiveFeatures(),
      hasPremiumAccess(),
      cookies(),
    ]);
    if (!features.rollouts.upgradeMoments || premium) return null;

    const timeZone = cookieStore.get(TIMEZONE_COOKIE)?.value;
    const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
    const dayOf = (iso: string) =>
      localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10);
    const now = Date.now();
    const supabase = createServiceRoleClient();
    const since = new Date(now - HISTORY_MS).toISOString();
    const [profile, history, orders, progress] = await Promise.all([
      supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
      supabase
        .from("analytics_events")
        .select("event_name, created_at")
        .eq("user_id", user.id)
        .in("event_name", ["GATE_MOMENT_SHOWN", "GATE_MOMENT_DISMISSED"])
        .gte("created_at", since),
      supabase
        .from("payment_orders")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["created", "pending"])
        .limit(1),
      fetchProgressCached(todayISO),
    ]);
    if (profile.error || history.error || orders.error || !progress) return null;

    const created = profile.data ? Date.parse(profile.data.created_at) : Number.NaN;
    const rows = history.data ?? [];
    const dismissals = rows
      .filter((row) => row.event_name === "GATE_MOMENT_DISMISSED")
      .map((row) => Date.parse(row.created_at))
      .filter((at) => Number.isFinite(at));
    const block = momentBlock({
      now,
      accountCreatedAt: Number.isFinite(created) ? created : null,
      isSubscriber: premium,
      hasOpenOrder: (orders.data ?? []).length > 0,
      shownToday: rows.some(
        (row) => row.event_name === "GATE_MOMENT_SHOWN" && dayOf(row.created_at) === todayISO,
      ),
      lastDismissedAt: dismissals.length > 0 ? Math.max(...dismissals) : null,
    });
    if (block) return null;

    const streak = progress.streak.currentStreak;
    // The story that was just finished may not be written yet when the finish page asks, so it is
    // counted as one on top of the OTHER stories finished today: finishing the same story again is
    // not a new one.
    const storiesToday =
      typeof storyId === "string"
        ? 1 +
          storiesFinishedOn(
            progress.completions.filter((entry) => entry.lessonId !== storyId),
            todayISO,
            dayOf,
          )
        : storiesFinishedOn(progress.completions, todayISO, dayOf);
    const moment = pickMoment(listed, { streak, storiesToday });
    if (!moment) return null;

    await track(
      { name: "GATE_MOMENT_SHOWN", category: "PREMIUM", properties: { moment } },
      user.id,
    );
    return { moment, streak, ...weekFigures(progress.completions, now) };
  } catch (error) {
    console.error("[upgrade-moments] could not decide a card", error);
    return null;
  }
}

/** Records what the learner did with a card they were shown: pressed its button, or closed it. */
export async function trackUpgradeMoment(
  moment: UpgradeMoment,
  action: "clicked" | "dismissed",
): Promise<void> {
  if (!isUpgradeMoment(moment)) return;
  const user = await getCurrentUser();
  if (!user) return;
  const name = action === "clicked" ? "GATE_MOMENT_CLICKED" : "GATE_MOMENT_DISMISSED";
  await track({ name, category: "PREMIUM", properties: { moment } }, user.id);
}
