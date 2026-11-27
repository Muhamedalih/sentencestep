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
import { cn } from "@/lib/utils";

import { ContinueCard } from "./continue-card";
import { PassagesSectionCard, VideoSectionCard } from "./section-cards";
import { StatsPanel } from "./stats-panel";
import type { BankCardData } from "@/lib/word-bank/shelves";

import { WordsBanner } from "@/components/words/words-banner";
import type { WordGroupSummary } from "@/types/word-lists";

import { WordsSection } from "./words-section";

async function PassagesSlot({
  data,
  className,
}: {
  data: Promise<PassagesHomeData | null>;
  className?: string;
}) {
  const resolved = await data;
  return resolved ? <PassagesSectionCard data={resolved} index={3} className={className} /> : null;
}

/**
 * The classic Home page in its new look (permission "homeCards"; see the card files beside this one):
 * the daily-tasks strip, then «up next» as one «keep learning» card (the story or the daily lesson)
 * beside the achievements panel (level and counts), then the Passages and Video cards, then the words
 * section at the foot. Nearly everything on it is data the classic page already loaded; the route adds
 * two small reads for the homeCards visitor only (the videos finished, the meanings on the word
 * cards). The page around it (banners, the admin's switch) is passed in by the route, so it stays the
 * route's.
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
  videosFinished,
  wordHints,
  wordsBank = null,
  calm = false,
  wordsFirst = null,
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
  /** Videos the learner has finished, or null when it cannot be read (the tile is then left out). */
  videosFinished: number | null;
  /** The Arabic meaning of the due words' cards, by word id. */
  wordHints: Record<string, string>;
  /** Today's words of the learner's words bank («كلماتي»), or null: the words card then shows the review queue. */
  wordsBank?: BankCardData | null;
  /** The calm look (permission "homeCalm"): tabs above the story card instead of a heading, a narrower centred page, no lift under the pointer. */
  calm?: boolean;
  /**
   * The words-first order (permission "homeWordsFirst"): the word-list titles for the Words banner. Row 1 is
   * the banner beside a level panel 35% narrower (20.75rem to 13.5rem); row 2 is Passages beside the keep-learning
   * card, both 25% taller than that card was (19.75rem to 24.7rem); row 3 is the Video card across the page with
   * a large player. The Words section at the foot gives way to the banner.
   */
  wordsFirst?: WordGroupSummary[] | null;
}) {
  if (wordsFirst) {
    return (
      <div
        className={cn(
          "mx-auto max-w-5xl px-6 pt-4 pb-12 sm:pt-6 sm:pb-16 xl:max-w-7xl",
          calm && "max-w-7xl pt-3 sm:pt-3",
        )}
        data-calm-home={calm ? "" : undefined}
      >
        {banners}
        <HomeEngagementSection stream={engagement} quiet cards calm={calm} className="hc-rise" />
        {!calm && (
          <div className="mt-4 mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
            {!isPremiumUser && <StarterPathProgress units={units} />}
          </div>
        )}
        <div className={cn("grid gap-4 lg:grid-cols-[minmax(0,1fr)_13.5rem]", calm && "mt-5")}>
          <WordsBanner
            groups={wordsFirst}
            isPremiumUser={isPremiumUser}
            reviewCount={reviewCount}
            reviewHref="/learn/word-lists/review"
            className="min-w-0 xl:h-[19.75rem] xl:min-h-0"
            lively
          />
          <StatsPanel
            lessonStats={lessonStats}
            sessionCount={sessionCount}
            videosFinished={videosFinished}
            narrow
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-end">
          <Suspense
            fallback={
              <CardSkeleton
                feature="passages"
                className={cn(
                  "min-h-[13.75rem]",
                  calm ? "lg:min-h-[24.7rem] xl:h-[27.4rem]" : "lg:min-h-[22rem] xl:h-[24.7rem]",
                )}
              />
            }
          >
            <PassagesSlot
              data={passages}
              className={
                calm ? "lg:min-h-[24.7rem] xl:h-[27.4rem]" : "lg:min-h-[22rem] xl:h-[24.7rem]"
              }
            />
          </Suspense>
          <div className="flex min-w-0 flex-col gap-3">
            <ContinueCard
              units={units}
              storiesUnits={storiesUnits}
              isPremiumUser={isPremiumUser}
              hasWeakWords={reviewCount > 0}
              extra={calm && !isPremiumUser ? <StarterPathProgress units={units} /> : null}
              tall
            />
          </div>
        </div>
        {video && (
          <div className="mt-4 flex">
            <VideoSectionCard
              card={video.card}
              heading={video.heading}
              cta={video.cta}
              index={4}
              wide
            />
          </div>
        )}
        {footer}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "mx-auto max-w-5xl px-6 pt-4 pb-12 sm:pt-6 sm:pb-16 xl:max-w-7xl",
        calm && "max-w-7xl pt-3 sm:pt-3",
      )}
      data-calm-home={calm ? "" : undefined}
    >
      {banners}
      <HomeEngagementSection stream={engagement} quiet cards calm={calm} className="hc-rise" />
      {!calm && (
        <div className="mt-4 mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
          {!isPremiumUser && <StarterPathProgress units={units} />}
        </div>
      )}
      <div
        className={cn("grid gap-4 lg:grid-cols-[minmax(0,1fr)_20.75rem]", calm && "mt-5 gap-y-4")}
      >
        <ContinueCard
          units={units}
          storiesUnits={storiesUnits}
          isPremiumUser={isPremiumUser}
          hasWeakWords={reviewCount > 0}
          extra={calm && !isPremiumUser ? <StarterPathProgress units={units} /> : null}
        />
        <StatsPanel
          lessonStats={lessonStats}
          sessionCount={sessionCount}
          videosFinished={videosFinished}
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
      <WordsSection reviewCount={reviewCount} words={dueWords} hints={wordHints} bank={wordsBank} />
      {footer}
    </div>
  );
}
