import { Suspense } from "react";

import { DailySessionCard } from "@/components/app/daily-session-card";
import {
  CardSkeleton,
  HomeEngagement,
  HomeEngagementFrame,
} from "@/components/app/home-engagement";
import { QuestsCard } from "@/components/app/quests-card";
import { StreakStrip } from "@/components/app/streak-strip";
import type { HomeEngagementStream } from "@/lib/features/home-engagement";

async function DailySessionSlot({ data }: { data: HomeEngagementStream["dailySession"] }) {
  return <DailySessionCard summary={await data} />;
}

async function QuestsSlot({ data }: { data: HomeEngagementStream["quests"] }) {
  return <QuestsCard payload={await data} />;
}

async function StreakSlot({
  today,
  data,
}: {
  today: string;
  data: HomeEngagementStream["streak"];
}) {
  return <StreakStrip today={today} strip={await data} />;
}

/**
 * Server half of Home's engagement cards. Each card is its OWN <Suspense>
 * slot awaiting only its own data (started alongside the page's queries, see
 * startHomeEngagement), so a card appears the moment it is ready instead of
 * waiting for the slowest of the three, and none of them can hold back the
 * greeting, stats or "up next" hero. Without a stream (first visit — no time
 * zone cookie yet) the browser loads them itself.
 */
export function HomeEngagementSection({
  stream,
  className,
}: {
  stream: HomeEngagementStream | null;
  className?: string;
}) {
  if (!stream) return <HomeEngagement className={className} />;
  return (
    <HomeEngagementFrame className={className}>
      <Suspense fallback={<CardSkeleton feature="dailySession" />}>
        <DailySessionSlot data={stream.dailySession} />
      </Suspense>
      <Suspense fallback={<CardSkeleton feature="quests" />}>
        <QuestsSlot data={stream.quests} />
      </Suspense>
      <Suspense fallback={<CardSkeleton feature="streakCalendar" />}>
        <StreakSlot today={stream.todayISO} data={stream.streak} />
      </Suspense>
    </HomeEngagementFrame>
  );
}
