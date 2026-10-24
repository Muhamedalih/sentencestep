import { Suspense } from "react";
import type { ReactNode } from "react";

import type { LessonStatsMap } from "@/components/app/home-hero";
import { FitHome } from "@/components/home-today/fit-home";
import { QuestsCard } from "@/components/app/quests-card";
import { StarterPathProgress } from "@/components/app/starter-path-progress";
import { HomeLessonCard } from "@/components/home-today/lesson-card";
import { LockedTestCard, TestYourselfCard } from "@/components/home-today/test-card";
import { TodayBox } from "@/components/home-today/today-box";
import { HomeTopBar } from "@/components/home-today/top-bar";
import type { HomeEngagementStream } from "@/lib/features/home-engagement";
import { getEffectiveFeatures } from "@/lib/features/queries";
import type { DailyQuestsPayload } from "@/lib/features/quests";
import { isTodayMode, splitToday, testCardState } from "@/lib/today/home-layout";
import { sentenceTestAvailable } from "@/lib/today/quests";
import type { CurrentUser } from "@/lib/supabase/auth";
import type { LessonUnit } from "@/types/content";

interface TopBarProps {
  user: CurrentUser;
  lessonStats: LessonStatsMap;
  sessionCount: number | null;
  reviewCount: number;
  className?: string;
}

/** The top bar waits only for the week (one cheap read, started with the page); until then it is drawn without it. */
async function TopBarSlot({ stream, ...props }: TopBarProps & { stream: HomeEngagementStream }) {
  const streak = await stream.streak;
  return <HomeTopBar {...props} today={stream.todayISO} streak={streak} />;
}

/** Today's tasks (or, if Today could not be built for this visit, the usual quests card, so the page is never empty). */
async function TodayBoxSlot({ quests }: { quests: Promise<DailyQuestsPayload | null> }) {
  const payload = await quests;
  if (!payload) return null;
  return isTodayMode(payload.quests) ? (
    <TodayBox payload={payload} />
  ) : (
    <QuestsCard payload={payload} />
  );
}

/**
 * The self-test card, there from the first moment: locked (slightly blurred, with the line that says
 * what opens it) until the day's three tasks are done, then the card itself once a test was dealt —
 * never an empty card, and no locked one for a learner the test is not open to.
 */
async function TestCardSlot({ quests }: { quests: Promise<DailyQuestsPayload | null> }) {
  const [payload, features] = await Promise.all([quests, getEffectiveFeatures()]);
  if (!payload) return null;
  const { tasks, test } = splitToday(payload.quests);
  const spacing = "roomy:mt-[clamp(0.75rem,2svh,1.25rem)] mt-5";
  // Locked only on Today's page; the fallback quests card (Today could not be built) has no test to wait for.
  const available = isTodayMode(payload.quests) && sentenceTestAvailable(features);
  switch (testCardState({ tasks, test, available })) {
    case "locked":
      return <LockedTestCard className={spacing} />;
    case "open":
      return test ? <TestYourselfCard quest={test} className={spacing} /> : null;
    default:
      return null;
  }
}

/**
 * Home for a learner who has the new page (permission `newHome`, which needs Today's session): one
 * calm screen — the greeting, Today's three tasks beside the learner's daily lesson, and under them
 * the self-test card. Each part that needs the day's data streams in by itself, like the cards of
 * the current Home, so none of them holds back the rest. The banners (guest, subscription ending,
 * payment left open) are drawn by the page and sit between the top bar and the tasks.
 */
export function HomeToday({
  stream,
  user,
  lessonStats,
  sessionCount,
  reviewCount,
  units,
  isPremiumUser,
  hasWeakWords,
  banners,
}: {
  stream: HomeEngagementStream;
  user: CurrentUser;
  lessonStats: LessonStatsMap;
  sessionCount: number | null;
  reviewCount: number;
  units: LessonUnit[];
  isPremiumUser: boolean;
  hasWeakWords: boolean;
  banners?: ReactNode;
}) {
  const topBar: TopBarProps = {
    user,
    lessonStats,
    sessionCount,
    reviewCount,
    className: "mb-6 max-sm:mb-5 roomy:mb-[clamp(0.75rem,2svh,1.5rem)]",
  };
  return (
    <>
      <Suspense fallback={<HomeTopBar {...topBar} today={stream.todayISO} streak={null} />}>
        <TopBarSlot stream={stream} {...topBar} />
      </Suspense>
      {banners}
      <FitHome>
        <div className="grid gap-5 lg:grid-cols-[1.08fr_1fr] lg:items-stretch">
          <Suspense
            fallback={
              <div
                className="bg-muted/60 min-h-[26rem] animate-pulse rounded-2xl"
                aria-hidden="true"
              />
            }
          >
            <TodayBoxSlot quests={stream.quests} />
          </Suspense>
          <div className="flex flex-col gap-3">
            <HomeLessonCard
              units={units}
              isPremiumUser={isPremiumUser}
              hasWeakWords={hasWeakWords}
              className="flex-1"
            />
            {/* Learners on the free plan keep their counter of starter lessons, small, under the card. */}
            {!isPremiumUser && <StarterPathProgress units={units} />}
          </div>
        </div>
        <Suspense fallback={null}>
          <TestCardSlot quests={stream.quests} />
        </Suspense>
      </FitHome>
    </>
  );
}
