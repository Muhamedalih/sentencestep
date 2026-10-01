"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { DailySessionCard } from "@/components/app/daily-session-card";
import { GuestFeatureTeaser } from "@/components/app/guest-feature-teaser";
import { EngagementStrip } from "@/components/app/engagement-strip";
import { useFeatures } from "@/components/providers/feature-provider";
import { fetchHomeEngagementAction } from "@/lib/features/home-engagement-actions";
import type { HomeEngagementData } from "@/lib/features/home-engagement";
import { todayLocalISODate } from "@/lib/progress/streak";
import { cn } from "@/lib/utils";

/**
 * The shared column the engagement cards sit in — with every feature off (and
 * nothing to teach a guest) it renders nothing and takes no space.
 */
export function HomeEngagementFrame({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 empty:hidden", className)}>
      <GuestFeatureTeaser />
      {children}
    </div>
  );
}

const SKELETON_HEIGHT = {
  dailySession: "h-28",
  strip: "h-16",
} as const;

/**
 * A placeholder shaped like one card, shown while that card's data loads —
 * only if that feature is switched on for this visitor, so nothing reserves
 * space for a card that will never appear.
 */
export function CardSkeleton({ feature }: { feature: keyof typeof SKELETON_HEIGHT }) {
  const features = useFeatures();
  const enabled =
    feature === "strip"
      ? features.quests.enabled || features.streakCalendar.enabled
      : features[feature].enabled;
  if (!enabled) return null;
  return (
    <div
      className={cn("bg-muted/60 animate-pulse rounded-2xl", SKELETON_HEIGHT[feature])}
      aria-hidden="true"
    />
  );
}

/**
 * The browser-side path, used only when the server couldn't render the cards
 * with the page — a learner's very first visit, before the browser has told the
 * server its time zone (see TimezoneCookie). It asks for all three cards in ONE
 * request (fetchHomeEngagementAction) rather than one each. In the normal case
 * the server renders them itself (see HomeEngagementSection) and this never runs.
 */
export function HomeEngagement({ className }: { className?: string }) {
  const { dailySession, quests, streakCalendar } = useFeatures();
  const anyEnabled = dailySession.enabled || quests.enabled || streakCalendar.enabled;
  // undefined = still loading; null = loaded but nothing to show.
  const [data, setData] = useState<HomeEngagementData | null | undefined>(undefined);

  useEffect(() => {
    if (!anyEnabled) return;
    let cancelled = false;
    fetchHomeEngagementAction(todayLocalISODate())
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, [anyEnabled]);

  return (
    <HomeEngagementFrame className={className}>
      {anyEnabled && data === undefined ? (
        <>
          <CardSkeleton feature="dailySession" />
          <CardSkeleton feature="strip" />
        </>
      ) : (
        data && (
          <>
            <DailySessionCard summary={data.dailySession} />
            <EngagementStrip today={data.todayISO} quests={data.quests} streak={data.streak} />
          </>
        )
      )}
    </HomeEngagementFrame>
  );
}
