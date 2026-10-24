"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles, Trophy } from "lucide-react";

import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { Button } from "@/components/ui/button";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { findCurrentLesson } from "@/lib/progress/level";
import { cn } from "@/lib/utils";
import type { LessonUnit } from "@/types/content";

/** The same springy lift as the cards of the current Home: it rises and grows a little under the pointer and settles with a soft overshoot (nothing moves for reduced motion). */
const CARD =
  "group border-border bg-card relative flex min-h-[19rem] flex-col overflow-hidden rounded-2xl border transition-[scale,translate,box-shadow] duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_22px_40px_-12px_rgba(0,0,0,0.5)] motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.05]";

/**
 * The learner's own lesson as a picture card (the one full-picture card of the page): the daily
 * lesson they are in the middle of, or the next one. The picture fills the card; the title and its
 * translation sit on a shade at the bottom, with a quiet glass button — the page's one solid button
 * belongs to Today's task. The whole card opens the lesson; the button is the link keyboard and
 * screen-reader users reach.
 */
function PictureCard({
  lesson,
  eyebrow,
  ctaLabel,
  href,
  footer,
  className,
}: {
  lesson: LessonUnit;
  eyebrow: string;
  ctaLabel: string;
  href: string;
  /** Optional quiet block under the button (the free-lessons-finished card). */
  footer?: ReactNode;
  className?: string;
}) {
  const { dir } = useLocale();
  const hasPicture = Boolean(lesson.illustrationUrl);
  return (
    <div className={cn(CARD, className)}>
      <div className="relative isolate flex flex-1 flex-col justify-end">
        <LessonIllustration
          mode="normal"
          lessonId={lesson.id}
          title={lesson.title}
          illustrationUrl={lesson.illustrationUrl}
          className={cn(
            "absolute aspect-auto rounded-none border-0 shadow-none transition-transform duration-500 ease-out motion-safe:group-hover:scale-105",
            hasPicture
              ? "inset-0 size-full lg:h-full"
              : "inset-x-0 top-0 bottom-[44%] h-auto [mask-image:linear-gradient(to_bottom,#000_72%,transparent)] lg:h-auto",
          )}
        />
        <span
          className="roomy:start-5 roomy:top-5 roomy:px-3.5 roomy:py-1 roomy:text-[13px] roomy:[zoom:1.1] absolute start-4 top-4 max-w-[80%] rounded-full bg-black/35 px-3 py-1 text-xs leading-snug font-semibold text-white backdrop-blur-sm"
          dir={dir}
        >
          {eyebrow}
        </span>
        <div className="roomy:gap-1 roomy:px-7 roomy:pt-16 roomy:pb-6 roomy:[zoom:1.1] relative flex flex-col gap-1 bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.86)_74%,rgba(0,0,0,0)_100%)] px-5 pt-10 pb-5 lg:pt-16">
          <h2
            className="roomy:text-3xl line-clamp-2 text-2xl leading-tight font-semibold tracking-tight text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]"
            dir="ltr"
          >
            {lesson.title}
          </h2>
          <p className="roomy:text-lg line-clamp-2 text-base font-medium text-white/85" dir={dir}>
            {lesson.supportTitle ?? lesson.title}
          </p>
          <Link
            href={href}
            className="focus-visible:ring-ring roomy:mt-4 roomy:h-11 roomy:px-7 roomy:text-base relative z-10 mt-3 inline-flex h-11 w-fit items-center justify-center rounded-[10px] bg-white/15 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors outline-none hover:bg-white/25 focus-visible:ring-2"
          >
            <span dir="auto">{ctaLabel}</span>
          </Link>
          {footer}
        </div>
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0" />
      </div>
    </div>
  );
}

/** A card with no picture to show: an icon, a heading, a line and one button. */
function PlainCard({
  icon,
  heading,
  body,
  action,
  className,
}: {
  icon: ReactNode;
  heading: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  const { dir } = useLocale();
  return (
    <div className={cn(CARD, "items-center justify-center gap-3 p-8 text-center", className)}>
      <div className="bg-brand-muted text-primary flex size-12 items-center justify-center rounded-full">
        {icon}
      </div>
      <div dir={dir}>
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        {body && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{body}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Home's lesson card on the new page. Same lesson logic as the lessons card of the current Home
 * (the lesson in progress, else the next, honouring the chosen level), in the same states: a
 * lesson to continue, the free lessons finished (a lesson to practise and a quiet way to see the
 * plans), everything finished (a review button when words are waiting).
 */
export function HomeLessonCard({
  units,
  isPremiumUser,
  hasWeakWords,
  className,
}: {
  units: LessonUnit[];
  isPremiumUser: boolean;
  /** Words are waiting for review: the "everything finished" card then offers them. */
  hasWeakWords: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const progress = useSharedProgress();
  const { isLoaded, startingLevel } = progress;
  const { rollouts } = useFeatures();
  const { completedIds, currentLesson, isResumed } = useCurrentLesson(
    units,
    isPremiumUser,
    progress,
  );
  if (units.length === 0) return null;
  if (!isLoaded) {
    return (
      <div
        className={cn("bg-muted min-h-[19rem] animate-pulse rounded-2xl", className)}
        aria-hidden="true"
      />
    );
  }

  const noCurrentLesson = !currentLesson;
  // The free lessons are finished: a real, deterministic free lesson to practise (never a made-up one).
  const freeFallback =
    noCurrentLesson && !isPremiumUser
      ? findCurrentLesson(units, [], false, startingLevel, rollouts.levelFloor)
      : undefined;
  const ctaLabel = isResumed
    ? t.common.resumeLesson
    : completedIds.length > 0
      ? t.common.continueLearning
      : t.common.startLearning;

  if (currentLesson) {
    return (
      <PictureCard
        lesson={currentLesson}
        eyebrow={t.nav.normalLessons}
        ctaLabel={ctaLabel}
        href={`/learn/normal/${currentLesson.id}`}
        className={className}
      />
    );
  }

  const plans = (
    <Button asChild size="lg" className="mt-1 w-fit">
      <Link href="/upgrade" dir="auto">
        {t.premium.seePlansCta}
      </Link>
    </Button>
  );

  if (!isPremiumUser && freeFallback) {
    return (
      <PictureCard
        lesson={freeFallback}
        eyebrow={t.premium.homeFreeCompleteHeading}
        ctaLabel={t.bookLibrary.practice}
        href={`/learn/normal/${freeFallback.id}`}
        className={className}
        footer={
          <div className="mt-3 flex flex-col gap-2 border-t border-white/20 pt-3">
            <p className="line-clamp-3 text-sm leading-snug text-white/75" dir="auto">
              {t.premium.homeFreeCompleteBody}
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="relative z-10 w-fit border-white/30 text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/upgrade" dir="auto">
                {t.premium.seePlansCta}
              </Link>
            </Button>
          </div>
        }
      />
    );
  }

  if (!isPremiumUser) {
    return (
      <PlainCard
        icon={<Sparkles className="size-6" aria-hidden="true" />}
        heading={t.premium.homeFreeCompleteHeading}
        body={t.premium.homeFreeCompleteBody}
        action={plans}
        className={className}
      />
    );
  }

  return (
    <PlainCard
      icon={<Trophy className="size-6" aria-hidden="true" />}
      heading={t.premium.homeAllDoneHeading}
      body={t.premium.homeAllDoneBody}
      action={
        hasWeakWords ? (
          <Button asChild size="lg" className="mt-1 w-fit">
            <Link href="/learn/word-lists/review">{t.lesson.fixMistakes}</Link>
          </Button>
        ) : undefined
      }
      className={className}
    />
  );
}
