import { Suspense } from "react";
import type { ReactNode } from "react";

import { CardSkeleton } from "@/components/app/home-engagement";
import { HomeEngagementSection } from "@/components/app/home-engagement-section";
import type { LessonStatsMap } from "@/components/app/home-hero";
import { StarterPathProgress } from "@/components/app/starter-path-progress";
import type { HomeEngagementStream } from "@/lib/features/home-engagement";
import type { PassagesHomeData } from "@/lib/passages/home-card";
import type { VideoCardData } from "@/lib/video-dictation/content";
import type { WeakWordItem } from "@/lib/weak-words/types";
import type { LessonUnit } from "@/types/content";

import { ContinueCard } from "./continue-card";
import { PassagesSectionCard, VideoSectionCard } from "./section-cards";
import { WordsPanel } from "./words-panel";

async function PassagesSlot({ data }: { data: Promise<PassagesHomeData | null> }) {
  const resolved = await data;
  return resolved ? <PassagesSectionCard data={resolved} index={3} /> : null;
}

/**
 * The classic Home page in its new look (permission "homeCards"; see the card files beside this one):
 * the daily-tasks strip, then «up next» as one «keep learning» card (the daily lesson or the story)
 * beside the words panel, then the Passages and Video cards. Everything on it is data the classic
 * page already loaded, so it adds no read. The page around it (banners, the admin's switch) is
 * passed in by the route, so it stays the route's.
 */
export function HomeCardsPage({
  engagement,
  heading,
  banners,
  footer,
  units,
  storiesUnits,
  isPremiumUser,
  lessonStats,
  sessionCount,
  reviewCount,
  dueWords,
  passages,
  video,
}: {
  engagement: HomeEngagementStream | null;
  /** «Up next». */
  heading: string;
  banners?: ReactNode;
  footer?: ReactNode;
  units: LessonUnit[];
  storiesUnits: LessonUnit[];
  isPremiumUser: boolean;
  lessonStats: LessonStatsMap;
  sessionCount: number | null;
  reviewCount: number;
  dueWords: WeakWordItem[];
  passages: Promise<PassagesHomeData | null>;
  video?: { card: VideoCardData; heading: string; cta: string };
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-4 pb-12 sm:pt-6 sm:pb-16 xl:max-w-7xl">
      {banners}
      <HomeEngagementSection stream={engagement} quiet cards className="hc-rise" />
      <div className="mt-4 mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
        {!isPremiumUser && <StarterPathProgress units={units} />}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20.75rem]">
        <ContinueCard
          units={units}
          storiesUnits={storiesUnits}
          isPremiumUser={isPremiumUser}
          hasWeakWords={reviewCount > 0}
        />
        <WordsPanel
          lessonStats={lessonStats}
          sessionCount={sessionCount}
          reviewCount={reviewCount}
          words={dueWords}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-4 empty:hidden">
        <Suspense
          fallback={
            <CardSkeleton feature="passages" className="min-h-[13.75rem] flex-1 basis-[20rem]" />
          }
        >
          <PassagesSlot data={passages} />
        </Suspense>
        {video && (
          <VideoSectionCard card={video.card} heading={video.heading} cta={video.cta} index={4} />
        )}
      </div>
      {footer}
    </div>
  );
}
