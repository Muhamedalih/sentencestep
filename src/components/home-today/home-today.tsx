import { Suspense } from "react";
import type { ReactNode } from "react";

import type { LessonStatsMap } from "@/components/app/home-hero";
import { FitHome } from "@/components/home-today/fit-home";
import { QuestsCard } from "@/components/app/quests-card";
import { StarterPathProgress } from "@/components/app/starter-path-progress";
import { HomeLessonCard } from "@/components/home-today/lesson-card";
import { TodayBox } from "@/components/home-today/today-box";
import { TodayEndCard } from "@/components/home-today/today-end-card";
import { HomeTopBar } from "@/components/home-today/top-bar";
import { CoursePathStrip } from "@/components/home-today/course-strip";
import { WeeklyLineView } from "@/components/today/today-tasks";
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
  /** The phone-only layout of the mobilePath permission: the totals line is left out below md:. */
  mobilePath?: boolean;
  className?: string;
}

/** The top bar waits only for the week (one cheap read, started with the page); until then it is drawn without it. */
async function TopBarSlot({ stream, ...props }: TopBarProps & { stream: HomeEngagementStream }) {
  const streak = await stream.streak;
  return <HomeTopBar {...props} today={stream.todayISO} streak={streak} />;
}

/**
 * Today's tasks (or, once nothing is left to open, the card that says so; or, if Today could not be
 * built for this visit, the usual quests card, so the page is never empty). The day's self-test card
 * is at the box's foot: there from the first moment,
 * locked (slightly blurred, with the line that says what opens it) until the day's three tasks are
 * done, then the card itself once a test was dealt — never an empty card, and no locked one for a
 * learner the test is not open to.
 */
async function TodayBoxSlot({ quests }: { quests: Promise<DailyQuestsPayload | null> }) {
  const [payload, features] = await Promise.all([quests, getEffectiveFeatures()]);
  if (!payload) return null;
  if (payload.todayEnd) return <TodayEndCard end={payload.todayEnd} />;
  if (!isTodayMode(payload.quests)) return <QuestsCard payload={payload} />;
  const { tasks, test } = splitToday(payload.quests);
  const state = testCardState({ tasks, test, available: sentenceTestAvailable(features) });
  return (
    <TodayBox payload={payload} test={state === "hidden" ? undefined : { state, quest: test }} />
  );
}

/** The weekly sentence test, a card of its own under the boxes (locked until twelve story sentences, then ready; or last week's result as one quiet line). It scales with the boxes above it. */
async function WeeklySlot({ quests }: { quests: Promise<DailyQuestsPayload | null> }) {
  const payload = await quests;
  if (!payload?.weekly || !(isTodayMode(payload.quests) || payload.todayEnd)) return null;
  return (
    <div className="roomy:mt-[clamp(0.75rem,2svh,1.25rem)] roomy:[zoom:var(--home-zoom,1.1)] mt-5">
      <WeeklyLineView line={payload.weekly} className="mt-0" />
    </div>
  );
}

/**
 * Home for a learner who has the new page (permission `newHome`, which needs Today's session): one
 * calm screen — the greeting, Today's three tasks (with the day's self-test at the foot of their
 * box) beside the learner's daily lesson, and under them the weekly test card. Each part that needs the day's data streams in by itself, like the cards of
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
  mobilePath = false,
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
  mobilePath?: boolean;
}) {
  const topBar: TopBarProps = {
    user,
    lessonStats,
    sessionCount,
    reviewCount,
    mobilePath,
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
          {mobilePath && <CoursePathStrip units={units} isPremiumUser={isPremiumUser} />}
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
              className={mobilePath ? "flex-1 max-md:hidden" : "flex-1"}
            />
            {/* Learners on the free plan keep their counter of starter lessons, small, under the card. */}
            {!isPremiumUser && <StarterPathProgress units={units} />}
          </div>
        </div>
        <Suspense fallback={null}>
          <WeeklySlot quests={stream.quests} />
        </Suspense>
      </FitHome>
    </>
  );
}
