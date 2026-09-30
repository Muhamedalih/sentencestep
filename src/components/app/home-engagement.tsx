"use client";

import { useEffect, useState } from "react";

import { DailySessionCard } from "@/components/app/daily-session-card";
import { GuestFeatureTeaser } from "@/components/app/guest-feature-teaser";
import { QuestsCard } from "@/components/app/quests-card";
import { StreakStrip } from "@/components/app/streak-strip";
import { useFeatures } from "@/components/providers/feature-provider";
import { fetchHomeEngagementAction } from "@/lib/features/home-engagement-actions";
import type { HomeEngagementData } from "@/lib/features/home-engagement";
import { todayLocalISODate } from "@/lib/progress/streak";
import { cn } from "@/lib/utils";

/**
 * Placeholder blocks — one per card that is switched on for this visitor —
 * shown while the engagement data is still loading. Shapes match the real
 * cards' heights so the page doesn't jump when they arrive. With every
 * feature off it renders nothing and takes no space.
 */
export function HomeEngagementSkeleton({ className }: { className?: string }) {
  const { dailySession, quests, streakCalendar } = useFeatures();
  return (
    <div className={cn("flex flex-col gap-4 empty:hidden", className)} aria-hidden="true">
      {dailySession.enabled && <div className="bg-muted/60 h-28 animate-pulse rounded-2xl" />}
      {quests.enabled && <div className="bg-muted/60 h-40 animate-pulse rounded-2xl" />}
      {streakCalendar.enabled && <div className="bg-muted/60 h-44 animate-pulse rounded-2xl" />}
    </div>
  );
}

/**
 * The block of optional engagement widgets on the Home dashboard — each one
 * decides for itself (from the data it's given, which is already empty for
 * anything the admin switches keep off) whether it renders, so this is just
 * their shared column. With every feature off it renders nothing and takes
 * no space.
 *
 * `initial` is what the server loaded together with the page (see
 * startHomeEngagement), so in the normal case there is no client fetch at all.
 * It is null on a learner's very first visit (the browser hasn't told the
 * server its time zone yet), and it is re-checked against the browser's own
 * date: if they differ (a traveller whose zone just changed) the browser
 * asks for the right day's data — one request for all three cards, not one
 * each.
 */
export function HomeEngagement({
  initial,
  className,
}: {
  initial: HomeEngagementData | null;
  className?: string;
}) {
  const { dailySession, quests, streakCalendar } = useFeatures();
  const anyEnabled = dailySession.enabled || quests.enabled || streakCalendar.enabled;
  // Remembers which `initial` a fetched result belongs to, so a refreshed page
  // (new `initial`) never shows an older client fetch over newer server data.
  const [fetched, setFetched] = useState<{
    source: HomeEngagementData | null;
    data: HomeEngagementData | null;
  } | null>(null);

  useEffect(() => {
    if (!anyEnabled) return;
    const today = todayLocalISODate();
    if (initial && initial.todayISO === today) return;
    let cancelled = false;
    fetchHomeEngagementAction(today)
      .then((data) => !cancelled && setFetched({ source: initial, data }))
      .catch(() => !cancelled && setFetched({ source: initial, data: null }));
    return () => {
      cancelled = true;
    };
  }, [anyEnabled, initial]);

  // undefined = still loading (first visit); null = loaded but nothing to show.
  const data =
    fetched && fetched.source === initial ? fetched.data : initial === null ? undefined : initial;

  if (data === undefined && anyEnabled) return <HomeEngagementSkeleton className={className} />;

  return (
    <div className={cn("flex flex-col gap-4 empty:hidden", className)}>
      <GuestFeatureTeaser />
      {data && (
        <>
          <DailySessionCard summary={data.dailySession} />
          <QuestsCard payload={data.quests} />
          <StreakStrip key={data.todayISO} today={data.todayISO} strip={data.streak} />
        </>
      )}
    </div>
  );
}
