"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { Button } from "@/components/ui/button";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { findCurrentLesson } from "@/lib/progress/level";
import { storyMonogram } from "@/lib/story-monogram";
import type { LessonUnit } from "@/types/content";

import { HOME_CARD_COLORS, STORY_BOOK } from "./palette";
import { homeCardsStrings } from "./strings";

type Choice = "lesson" | "story";

/** The shade that lets the lesson's picture fade into the card's own colour. */
const LESSON_BASE = HOME_CARD_COLORS.lesson.base;
const LESSON_SHADE = `linear-gradient(90deg,${LESSON_BASE} 0%,${LESSON_BASE} 36%,color-mix(in srgb,${LESSON_BASE} 86%,transparent) 54%,transparent 100%)`;

/** The white button of the story choice (the lesson choice keeps the site's own button, like every lesson card). */
const WHITE_BUTTON =
  "inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-white px-6 text-base font-bold text-slate-900 transition-colors outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70";

function Texts({
  title,
  support,
  lines,
  narrow = false,
  children,
}: {
  title: string;
  support: string;
  lines: ReactNode;
  /** Keeps the text clear of the story's cover on the right. */
  narrow?: boolean;
  children: ReactNode;
}) {
  const { dir } = useLocale();
  return (
    <div
      className={`relative flex h-full flex-col px-7 pt-28 pb-7 sm:pt-[4.75rem] ${narrow ? "max-w-[32rem]" : "max-w-[44rem]"}`}
    >
      <h2
        dir="ltr"
        className="line-clamp-2 text-3xl leading-[1.15] font-bold tracking-tight text-white xl:text-[2.5rem]"
      >
        {title}
      </h2>
      <p className="mt-1 line-clamp-1 text-lg font-medium text-white/85" dir={dir}>
        {support}
      </p>
      <div className="mt-3.5 flex max-w-[40rem] flex-col gap-1 border-t border-white/15 pt-3 text-sm text-white/80">
        {lines}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">{children}</div>
    </div>
  );
}

/**
 * The merged «keep learning» card of the Home cards: the stories and the daily lessons share one
 * card with two choices inside it, the stories first and chosen by default (the lesson is still one
 * tap on the other choice; a learner with no story left in their level starts on the lesson). The
 * choices swap with a short slide (see `hc-pane` in globals.css) and the card's own colour follows:
 * the lesson is the picture of the lesson, the story is the Stories colour with a standing book
 * (the story's first letter on its cover) and a «language learning hub» tag that tells this card from
 * the words section below, the «writing» side. The lesson side is exactly what the old lesson card
 * showed (same lesson, same label, same link); the story side is the story the old Stories card
 * pointed at, but it opens that story directly.
 */
export function ContinueCard({
  units,
  storiesUnits,
  isPremiumUser,
  hasWeakWords,
}: {
  units: LessonUnit[];
  storiesUnits: LessonUnit[];
  isPremiumUser: boolean;
  hasWeakWords: boolean;
}) {
  const { t, dir, locale } = useLocale();
  const s = homeCardsStrings(locale);
  const progress = useSharedProgress();
  const { isLoaded, getCompletedIds, startingLevel } = progress;
  const { rollouts } = useFeatures();
  const { completedIds, currentLesson, isResumed } = useCurrentLesson(
    units,
    isPremiumUser,
    progress,
  );
  const [picked, setPicked] = useState<Choice | null>(null);
  const stories = HOME_CARD_COLORS.stories;
  const lessonColors = HOME_CARD_COLORS.lesson;

  const noCurrentLesson = units.length > 0 && !currentLesson;
  // A free learner who has done every free lesson still gets a real lesson to show (as the old card did).
  const freeFallbackLesson =
    noCurrentLesson && !isPremiumUser
      ? findCurrentLesson(units, [], false, startingLevel, rollouts.levelFloor)
      : undefined;
  const lesson = currentLesson ?? freeFallbackLesson;

  const storiesDone = isLoaded ? getCompletedIds("stories") : [];
  const story = findCurrentLesson(
    storiesUnits,
    storiesDone,
    isPremiumUser,
    startingLevel,
    rollouts.levelFloor,
  );

  if (!isLoaded) {
    return (
      <div className="bg-muted/60 min-h-[19.75rem] animate-pulse rounded-2xl" aria-hidden="true" />
    );
  }

  const lessonLabel = isResumed
    ? t.common.resumeLesson
    : completedIds.length > 0
      ? t.common.continueLearning
      : t.common.startLearning;
  const rtl = locale === "ar";
  // The stories come first; only a learner with no story left but a lesson to do starts on the lesson.
  const choice: Choice = picked ?? (story || !lesson ? "story" : "lesson");
  const onStory = choice === "story";

  return (
    <section
      aria-label={s.continueTitle}
      className="hc-card hc-rise relative isolate min-h-[22rem] overflow-hidden rounded-2xl border text-white transition-[border-color] duration-300 xl:h-[19.75rem] xl:min-h-0"
      style={
        {
          background: lessonColors.background,
          borderColor: onStory ? stories.edge : lessonColors.edge,
          "--hc-i": 1,
        } as CSSProperties
      }
    >
      <div className="absolute start-7 top-5 z-20 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[15px] font-bold" dir={dir}>
          {s.continueTitle}
        </span>
        <div
          role="tablist"
          aria-label={s.continueTitle}
          dir={rtl ? "rtl" : "ltr"}
          className="relative grid grid-cols-2 rounded-xl border border-white/10 bg-black/45 p-1"
        >
          <span
            aria-hidden="true"
            className="hc-knob absolute inset-y-1 start-1 w-[calc(50%-0.25rem)] rounded-[9px] bg-white/15"
            style={{
              transform: `translateX(${onStory ? "0" : rtl ? "-100%" : "100%"})`,
            }}
          />
          {(
            [
              ["story", s.tabStories],
              ["lesson", s.tabLessons],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`home-continue-tab-${id}`}
              aria-selected={choice === id}
              aria-controls={`home-continue-pane-${id}`}
              onClick={() => setPicked(id)}
              className={`relative z-10 cursor-pointer rounded-[9px] px-4 py-1.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                choice === id ? "text-white" : "text-white/70 hover:text-white"
              }`}
              dir={dir}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* The lesson: the lesson's picture on the right, the text over a shade from the left. */}
      <div
        id="home-continue-pane-lesson"
        role="tabpanel"
        aria-labelledby="home-continue-tab-lesson"
        className="hc-pane absolute inset-0"
        data-side="lesson"
        data-on={!onStory}
        inert={onStory}
      >
        {lesson && (
          <LessonIllustration
            mode="normal"
            lessonId={lesson.id}
            title={lesson.title}
            illustrationUrl={lesson.illustrationUrl}
            className="absolute inset-y-0 end-0 aspect-auto h-full w-[68%] rounded-none border-0 shadow-none"
          />
        )}
        <div className="absolute inset-0" style={{ backgroundImage: LESSON_SHADE }} />
        {lesson ? (
          <Texts
            title={lesson.title}
            support={lesson.supportTitle ?? lesson.title}
            lines={
              <>
                {lesson.description && (
                  <p className="line-clamp-1" dir="ltr">
                    {lesson.description}
                  </p>
                )}
                {lesson.supportDescription && (
                  <p className="line-clamp-1" dir={dir}>
                    {lesson.supportDescription}
                  </p>
                )}
                {freeFallbackLesson && (
                  <p className="line-clamp-2 text-white/70" dir={dir}>
                    {t.premium.homeFreeCompleteBody}
                  </p>
                )}
              </>
            }
          >
            <Button asChild size="lg">
              <Link href={`/learn/normal/${lesson.id}`}>
                <span dir={dir}>{freeFallbackLesson ? t.bookLibrary.practice : lessonLabel}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            {freeFallbackLesson && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/upgrade" dir="auto">
                  {t.premium.seePlansCta}
                </Link>
              </Button>
            )}
          </Texts>
        ) : (
          <Texts
            title={noCurrentLesson ? t.premium.homeAllDoneHeading : t.nav.normalLessons}
            support={noCurrentLesson ? t.premium.homeAllDoneBody : ""}
            lines={null}
          >
            {noCurrentLesson && hasWeakWords ? (
              <Button asChild size="lg">
                <Link href="/learn/word-lists/review">{t.lesson.fixMistakes}</Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/learn/normal">{t.nav.normalLessons}</Link>
              </Button>
            )}
          </Texts>
        )}
      </div>

      {/* The story: the Stories colour all over, a standing book with the story's first letter on its cover, and the «language» tag. */}
      <div
        id="home-continue-pane-story"
        role="tabpanel"
        aria-labelledby="home-continue-tab-story"
        className="hc-pane absolute inset-0"
        data-side="story"
        data-on={onStory}
        inert={!onStory}
      >
        <div className="absolute inset-0" style={{ background: stories.background }} />
        <span className="absolute end-4 top-4 z-10">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold"
            style={{
              background: stories.chip,
              borderColor: stories.chipEdge,
              color: stories.accent,
            }}
            dir={dir}
          >
            <BookOpen className="size-3.5" aria-hidden="true" />
            {s.languageCenter}
          </span>
        </span>
        <div
          aria-hidden="true"
          className="hc-tilt-r absolute end-24 top-14 hidden h-[21.6rem] w-[15.6rem] sm:block"
        >
          <i
            className="absolute rounded-[4px_10px_10px_4px]"
            style={{
              inset: "7px -8px -8px 9px",
              background: STORY_BOOK.pages,
              boxShadow: STORY_BOOK.shadow,
            }}
          />
          <div
            className="absolute inset-0 overflow-hidden rounded-[5px_12px_12px_5px]"
            style={{ background: STORY_BOOK.cover, boxShadow: STORY_BOOK.coverEdge }}
          >
            <span
              className="absolute inset-y-0 left-0 w-[22px]"
              style={{ background: STORY_BOOK.spine }}
            />
            <span
              className="absolute rounded-[3px] border-[1.5px]"
              style={{ inset: "22px 22px 22px 40px", borderColor: STORY_BOOK.frame }}
            />
            <span
              className="font-quote pointer-events-none absolute top-[46px] left-[66px] text-[11.9rem] leading-[0.85] font-bold tracking-[-0.02em] select-none"
              style={{ color: STORY_BOOK.ink }}
            >
              {storyMonogram(story?.title ?? t.nav.stories)}
            </span>
            <span className="absolute right-[46px] bottom-[62px] left-[66px] flex flex-col gap-[9px]">
              <i className="block h-1.5 rounded-[3px]" style={{ background: STORY_BOOK.line }} />
              <i
                className="block h-1.5 w-[72%] rounded-[3px]"
                style={{ background: STORY_BOOK.line }}
              />
            </span>
          </div>
        </div>
        {story ? (
          <Texts
            narrow
            title={story.title}
            support={story.supportTitle ?? s.storyLine}
            lines={
              story.supportTitle ? (
                <p className="line-clamp-1" dir={dir}>
                  {s.storyLine}
                </p>
              ) : null
            }
          >
            <Link href={`/learn/stories/${story.id}`} className={WHITE_BUTTON}>
              <span dir={dir}>{storiesDone.length > 0 ? s.storyContinue : s.storyStart}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Texts>
        ) : (
          <Texts narrow title={t.nav.stories} support={s.storiesAllDone} lines={null}>
            <Link href="/learn/stories" className={WHITE_BUTTON}>
              <span dir={dir}>{t.nav.stories}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Texts>
        )}
      </div>
    </section>
  );
}
