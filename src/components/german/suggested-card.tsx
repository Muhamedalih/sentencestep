"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import type { LessonUnit } from "@/types/content";

type Choice = "story" | "lesson";

/** The white button of the story choice, the same as the English Home's. */
const WHITE_BUTTON =
  "inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-bold text-slate-900 transition-colors outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70 xl:h-12 xl:px-6 xl:text-base";

/**
 * The «keep learning» card of the German Home (permission germanTrack, Admins only): the English Home's
 * keep-learning card at a smaller size, with no section name, only what to do next — the next story or
 * the next daily lesson. A small picker in its corner switches between the two (daily lessons, stories).
 * It opens on the one the learner did not do last: after a lesson the story, after a story (or with
 * nothing finished yet) the lesson, and when one of the two has run out the other. The Passages card is
 * its own card beside it and has nothing to do with this one.
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
  const [picked, setPicked] = useState<Choice | null>(null);

  if (!isLoaded) {
    return (
      <div
        className="bg-muted/60 min-h-[13.75rem] min-w-0 flex-1 basis-[20rem] animate-pulse rounded-2xl xl:min-h-[17rem]"
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

  // What the learner finished last in German decides which of the two opens first.
  const last = completions
    .filter((entry) => entry.lessonId.startsWith(GERMAN_ID_PREFIX))
    .reduce<(typeof completions)[number] | null>(
      (latest, entry) => (!latest || entry.completedAt > latest.completedAt ? entry : latest),
      null,
    );
  const wantStory = last?.mode === "normal";
  const suggested: Choice =
    wantStory && story ? "story" : lesson ? "lesson" : story ? "story" : "lesson";
  const choice: Choice = picked ?? suggested;

  const startedLessons = completedIds.some((id) => id.startsWith(GERMAN_ID_PREFIX));
  const startedStories = getCompletedIds("stories").some((id) => id.startsWith(GERMAN_ID_PREFIX));
  const lessonLabel = isResumed
    ? t.common.resumeLesson
    : startedLessons
      ? t.common.continueLearning
      : t.common.startLearning;

  const onStory = choice === "story";
  const colors = onStory ? stories : lessonColors;
  const card: CSSProperties = {
    background: colors.background,
    borderColor: colors.edge,
    borderRadius: grey ? GREY.radius.card : undefined,
  };
  const rtl = locale === "ar";
  const titleClass =
    "mt-3 line-clamp-2 text-[1.65rem] leading-tight font-bold tracking-tight xl:text-[2.1rem]";
  const supportClass = "mt-0.5 line-clamp-1 text-base font-medium text-white/85 xl:text-lg";
  const lineClass =
    "mt-2.5 line-clamp-1 border-t border-white/15 pt-2 text-sm text-white/75 xl:text-[15px]";

  return (
    <section
      aria-label={s.continueTitle}
      className="hc-card hc-rise relative isolate min-h-[13.75rem] min-w-0 flex-1 basis-[20rem] overflow-hidden rounded-2xl border text-white xl:min-h-[17rem]"
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
          className="hc-tilt-r absolute end-6 top-14 hidden h-[21.6rem] w-[15.6rem] origin-top-right scale-[0.46] sm:block xl:top-16 xl:scale-[0.58]"
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

      {/* The picker in the corner: the daily lessons or the stories. */}
      <div
        role="tablist"
        aria-label={s.continueTitle}
        dir={rtl ? "rtl" : "ltr"}
        className="absolute end-4 top-4 z-20 grid grid-cols-2 rounded-xl border border-white/10 bg-black/45 p-1"
      >
        {(
          [
            ["lesson", s.tabLessons],
            ["story", s.tabStories],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={choice === id}
            onClick={() => setPicked(id)}
            className={cn(
              "cursor-pointer rounded-[9px] px-3 py-1 text-[12.5px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              choice === id ? "bg-white/15 text-white" : "text-white/70 hover:text-white",
            )}
            dir={dir}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative flex h-full min-h-[13.75rem] max-w-[62%] flex-col px-6 py-5 max-sm:max-w-none xl:min-h-[17rem] xl:px-7 xl:py-6">
        <span className="text-[13.5px] font-bold xl:text-[15px]" dir={dir}>
          {s.continueTitle}
        </span>
        {choice === "story" && story ? (
          <>
            <h2 dir="ltr" className={titleClass}>
              {story.title}
            </h2>
            <p className={supportClass} dir={dir}>
              {story.supportTitle ?? s.storyLine}
            </p>
            {story.supportTitle && (
              <p className={lineClass} dir={dir}>
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
            <h2 dir="ltr" className={titleClass}>
              {lesson.title}
            </h2>
            <p className={supportClass} dir={dir}>
              {lesson.supportTitle ?? lesson.title}
            </p>
            {lesson.supportDescription && (
              <p className={lineClass} dir={dir}>
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
          // The chosen side has nothing left: say so and open its list.
          <>
            <h2 className={titleClass} dir={dir}>
              {onStory ? t.nav.stories : t.premium.homeAllDoneHeading}
            </h2>
            <p className={supportClass} dir={dir}>
              {onStory ? s.storiesAllDone : t.premium.homeAllDoneBody}
            </p>
            <Link
              href={onStory ? "/learn/stories" : "/learn/normal"}
              className={`${WHITE_BUTTON} mt-auto`}
            >
              <span dir={dir}>{onStory ? t.nav.stories : t.nav.normalLessons}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
