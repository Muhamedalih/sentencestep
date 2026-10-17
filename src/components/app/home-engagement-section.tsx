import { Suspense } from "react";

import { DailySessionCard } from "@/components/app/daily-session-card";
import {
  CardSkeleton,
  HomeEngagement,
  HomeEngagementFrame,
} from "@/components/app/home-engagement";
import { EngagementStrip } from "@/components/app/engagement-strip";
import { PassagesCard } from "@/components/app/passages-card";
import type { HomeEngagementStream } from "@/lib/features/home-engagement";
import type { PassagesHomeData } from "@/lib/passages/home-card";

async function DailySessionSlot({ data }: { data: HomeEngagementStream["dailySession"] }) {
  return <DailySessionCard summary={await data} />;
}

async function PassagesSlot({
  data,
  className,
}: {
  data: Promise<PassagesHomeData | null>;
  className?: string;
}) {
  return <PassagesCard data={await data} className={className} />;
}

async function EngagementStripSlot({
  today,
  quests,
  streak,
}: {
  today: string;
  quests: HomeEngagementStream["quests"];
  streak: HomeEngagementStream["streak"];
}) {
  const [questsPayload, streakData] = await Promise.all([quests, streak]);
  return <EngagementStrip today={today} quests={questsPayload} streak={streakData} />;
}

/**
 * Server half of Home's engagement cards (today's session, quests + streak).
 * Each card is its OWN <Suspense>
 * slot awaiting only its own data (started alongside the page's queries, see
 * startHomeEngagement), so a card appears the moment it is ready instead of
 * waiting for the slowest of them, and none of them can hold back the
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
      <Suspense fallback={<CardSkeleton feature="strip" />}>
        <EngagementStripSlot
          today={stream.todayISO}
          quests={stream.quests}
          streak={stream.streak}
        />
      </Suspense>
    </HomeEngagementFrame>
  );
}

/**
 * Home's Passages card, streamed in by itself under the "Up next" heading (see
 * startHomePassagesCard — it needs no time zone, so it is there on every visit).
 * `className` carries the card's margin, so a card that isn't drawn leaves no gap.
 */
export function HomePassages({
  data,
  className,
}: {
  data: Promise<PassagesHomeData | null>;
  className?: string;
}) {
  return (
    <Suspense fallback={<CardSkeleton feature="passages" className={className} />}>
      <PassagesSlot data={data} className={className} />
    </Suspense>
  );
}
