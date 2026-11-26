"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GREY, STORY_BOOK, homeCardColors } from "@/components/home-cards/palette";
import { homeCardsStrings } from "@/components/home-cards/strings";
import { useGreyHome } from "@/components/home-cards/use-grey-home";
import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { Button } from "@/components/ui/button";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { GERMAN_ID_PREFIX } from "@/lib/learn-language";
import { findCurrentLesson } from "@/lib/progress/level";
import { storyMonogram } from "@/lib/story-monogram";
import type { LessonUnit } from "@/types/content";

/** The white button of the story choice, the same as the English Home's. */
const WHITE_BUTTON =
  "inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-bold text-slate-900 transition-colors outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70";

/**
 * The small «keep learning» card of the German Home (permission germanTrack, Admins only): the English
 * Home's keep-learning card at half its size, with no tabs and no section name, only what to do next —
 * the next story or the next daily lesson. It alternates: after a lesson it suggests the story, after a
 * story (or with nothing finished yet) it suggests the lesson, and when one of the two has run out it
 * suggests the other. The Passages card is its own card beside it and has nothing to do with this one.
 */
export function GermanSuggestedCard({
  units,
  storiesUnits,
}: {
  units: LessonUnit[];
  storiesUnits: LessonUnit[];
}) {
  const { t, dir, locale } = useLocale();
  const s = homeCardsStrings(locale);
  const progress = useSharedProgress();
  const { isLoaded, getCompletedIds, startingLevel, completions } = progress;
  const { rollouts } = useFeatures();
  const { completedIds, currentLesson, isResumed } = useCurrentLesson(units, true, progress);
  const grey = useGreyHome();
  const stories = homeCardColors(grey, "stories");
  const lessonColors = homeCardColors(grey, "lesson");

  if (!isLoaded) {
    return (
      <div
        className="bg-muted/60 min-h-[13.75rem] min-w-0 flex-1 basis-[20rem] animate-pulse rounded-2xl"
        aria-hidden="true"
      />
    );
  }

  const story = findCurrentLesson(
    storiesUnits,
    getCompletedIds("stories"),
    true,
    startingLevel,
    rollouts.levelFloor,
  );
  const lesson = currentLesson;

  // What the learner finished last in German decides which of the two comes next.
  const last = completions
    .filter((entry) => entry.lessonId.startsWith(GERMAN_ID_PREFIX))
    .reduce<(typeof completions)[number] | null>(
      (latest, entry) => (!latest || entry.completedAt > latest.completedAt ? entry : latest),
      null,
    );
  const wantStory = last?.mode === "normal";
  const choice: "story" | "lesson" | null =
    wantStory && story ? "story" : lesson ? "lesson" : story ? "story" : null;

  const startedLessons = completedIds.some((id) => id.startsWith(GERMAN_ID_PREFIX));
  const startedStories = getCompletedIds("stories").some((id) => id.startsWith(GERMAN_ID_PREFIX));
  const lessonLabel = isResumed
    ? t.common.resumeLesson
    : startedLessons
      ? t.common.continueLearning
      : t.common.startLearning;

  const onStory = choice === "story";
  const colors = onStory || !lesson ? stories : lessonColors;
  const card: CSSProperties = {
    background: colors.background,
    borderColor: colors.edge,
    borderRadius: grey ? GREY.radius.card : undefined,
  };

  return (
    <section
      aria-label={s.continueTitle}
      className="hc-card hc-rise relative isolate min-h-[13.75rem] min-w-0 flex-1 basis-[20rem] overflow-hidden rounded-2xl border text-white"
      style={{ ...card, "--hc-i": 4 } as CSSProperties}
    >
      {choice === "lesson" && lesson && (
        <>
          <LessonIllustration
            mode="normal"
            lessonId={lesson.id}
            title={lesson.title}
            illustrationUrl={lesson.illustrationUrl}
            className="absolute inset-y-0 end-0 aspect-auto h-full w-[55%] rounded-none border-0 shadow-none"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(90deg,${lessonColors.base} 0%,${lessonColors.base} 40%,color-mix(in srgb,${lessonColors.base} 86%,transparent) 58%,transparent 100%)`,
            }}
          />
        </>
      )}
      {choice === "story" && story && (
        <div
          aria-hidden="true"
          className="hc-tilt-r absolute end-6 top-5 hidden h-[21.6rem] w-[15.6rem] origin-top-right scale-[0.5] sm:block"
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
              {storyMonogram(story.title)}
            </span>
          </div>
        </div>
      )}

      <div className="relative flex h-full min-h-[13.75rem] max-w-[62%] flex-col px-6 py-5 max-sm:max-w-none">
        <span className="text-[13.5px] font-bold" dir={dir}>
          {s.continueTitle}
        </span>
        {choice === "story" && story ? (
          <>
            <h2
              dir="ltr"
              className="mt-3 line-clamp-2 text-[1.65rem] leading-tight font-bold tracking-tight"
            >
              {story.title}
            </h2>
            <p className="mt-0.5 line-clamp-1 text-base font-medium text-white/85" dir={dir}>
              {story.supportTitle ?? s.storyLine}
            </p>
            {story.supportTitle && (
              <p
                className="mt-2.5 line-clamp-1 border-t border-white/15 pt-2 text-sm text-white/75"
                dir={dir}
              >
                {s.storyLine}
              </p>
            )}
            <Link
              href={`/learn/stories/${story.id}`}
              className={`${WHITE_BUTTON} mt-auto`}
              style={grey ? { borderRadius: GREY.radius.button } : undefined}
            >
              <span dir={dir}>{startedStories ? s.storyContinue : s.storyStart}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        ) : choice === "lesson" && lesson ? (
          <>
            <h2
              dir="ltr"
              className="mt-3 line-clamp-2 text-[1.65rem] leading-tight font-bold tracking-tight"
            >
              {lesson.title}
            </h2>
            <p className="mt-0.5 line-clamp-1 text-base font-medium text-white/85" dir={dir}>
              {lesson.supportTitle ?? lesson.title}
            </p>
            {lesson.supportDescription && (
              <p
                className="mt-2.5 line-clamp-1 border-t border-white/15 pt-2 text-sm text-white/75"
                dir={dir}
              >
                {lesson.supportDescription}
              </p>
            )}
            <Button asChild size="lg" className="mt-auto w-fit">
              <Link href={`/learn/normal/${lesson.id}`}>
                <span dir={dir}>{lessonLabel}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <h2 className="mt-3 text-[1.65rem] leading-tight font-bold tracking-tight" dir={dir}>
              {t.nav.stories}
            </h2>
            <p className="mt-0.5 text-base text-white/85" dir={dir}>
              {s.storiesAllDone}
            </p>
            <Link href="/learn/stories" className={`${WHITE_BUTTON} mt-auto`}>
              <span dir={dir}>{t.nav.stories}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
