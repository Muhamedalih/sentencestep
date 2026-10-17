"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, Trophy } from "lucide-react";

import { HomeBookCard } from "@/components/app/home-book-card";
import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { findCurrentLesson } from "@/lib/progress/level";
import { cn } from "@/lib/utils";
import type { LessonUnit } from "@/types/content";
import type { Book } from "@/types/library";

/** Sentence/word totals for one lesson, keyed by `${mode}:${lessonId}` — see (dashboard)/[mode]/page.tsx, which derives this once from the same lesson content it already fetches for the lesson list, no extra queries. Also consumed by HomeHeaderBar for its Sessions/Lines/Words tiles (see that component's own doc comment). */
export type LessonStatsMap = Record<string, { sentences: number; words: number }>;

/**
 * The large card's actual content — shared by the real current-lesson state and the
 * free-lessons-exhausted fallback below (same JSX either way, just a different
 * lesson/eyebrow/CTA), so restyling this layout never means keeping two copies in sync.
 *
 * The whole card is the lesson's picture (the admin's pictures are 4:5 portraits, which is why
 * the card is 4:5 from lg up). The eyebrow sits on it as a small glass pill; the title, its
 * translation, the two short blurbs and the button are written in white over a shade that
 * fades up from the bottom, so they read on any picture, a bright one included. A lesson with
 * no picture keeps its hand-drawn scene in the card's upper part. The whole card opens the
 * lesson; the button is the one link keyboard and screen-reader users reach.
 */
function MainLessonCardBody({
  lesson,
  eyebrow,
  ctaLabel,
  href,
  dir,
  footer,
}: {
  lesson: LessonUnit;
  eyebrow: string;
  ctaLabel: string;
  href: string;
  dir: "rtl" | "ltr";
  /** Optional quiet block under the button — only the finished-the-starter-lessons card uses it. */
  footer?: ReactNode;
}) {
  const hasPicture = Boolean(lesson.illustrationUrl);
  return (
    <div className="relative isolate flex flex-1 flex-col justify-end">
      <LessonIllustration
        mode="normal"
        lessonId={lesson.id}
        title={lesson.title}
        illustrationUrl={lesson.illustrationUrl}
        className={cn(
          "absolute aspect-auto rounded-none border-0 shadow-none transition-transform duration-500 ease-out motion-safe:group-hover:scale-105",
          hasPicture
            ? "inset-0 size-full"
            : "inset-x-0 top-0 bottom-[44%] h-auto [mask-image:linear-gradient(to_bottom,#000_72%,transparent)] lg:h-auto",
        )}
      />
      <span
        className="absolute start-4 top-4 max-w-[80%] rounded-full bg-black/35 px-3 py-1 text-xs leading-snug font-semibold text-white backdrop-blur-sm"
        dir={dir}
      >
        {eyebrow}
      </span>
      {/* The shade belongs to the text block, not to the card: it is as tall as the text (so the text always sits on its darkest part, whatever the card's height or the picture), and its top 64px fade into the picture. */}
      <div className="relative flex flex-col gap-1.5 bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.86)_74%,rgba(0,0,0,0)_100%)] px-5 pt-16 pb-5 sm:px-6 sm:pb-6">
        <h2
          className="line-clamp-2 text-2xl leading-tight font-semibold tracking-tight text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.55)] sm:text-3xl"
          dir="ltr"
        >
          {lesson.title}
        </h2>
        <p className="line-clamp-2 text-base font-medium text-white/85" dir={dir}>
          {lesson.supportTitle ?? lesson.title}
        </p>
        {(lesson.description || lesson.supportDescription) && (
          <div className="mt-1.5 flex flex-col gap-1 border-t border-white/15 pt-2.5">
            {lesson.description && (
              <p className="line-clamp-2 text-sm leading-snug text-white/75" dir="ltr">
                {lesson.description}
              </p>
            )}
            {lesson.supportDescription && (
              <p className="line-clamp-2 text-sm leading-snug text-white/75" dir={dir}>
                {lesson.supportDescription}
              </p>
            )}
          </div>
        )}
        <Button asChild size="lg" className="relative z-10 mt-3 w-fit">
          <Link href={href}>{ctaLabel}</Link>
        </Button>
        {footer}
      </div>
      <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0" />
    </div>
  );
}

/**
 * The Home page's three-card composition (redesign, Section 2): a large
 * "what should I do next" card for the learner's actual current/next normal
 * lesson (unchanged logic from before this redesign — same findCurrentLesson,
 * same LessonIllustration, same navigation), plus two smaller stacked cards
 * — a real recommended book (Section 2B) and the learner's actual
 * current/next Stories lesson (Section 2C, same findCurrentLesson machinery
 * as the main card, just pointed at Stories content instead of Normal). The
 * Sessions/Lines/Words stat row this component used to render at the bottom
 * moved to HomeHeaderBar at the top of the page (see that component's own
 * doc comment) — Section 1 of the redesign asks for every progress number in
 * one prominent top block, not split between here and there.
 *
 * When the learner has cleared every free lesson they're eligible for
 * (`noCurrentLesson`, not premium), the large card no longer collapses to a
 * plain text-only "you've completed every free lesson" message — see
 * `freeFallbackLesson`/MainLessonCardBody above for the real, deterministic
 * free lesson it shows instead, keeping this card image-led in every state.
 */
export function HomeHero({
  units,
  storiesUnits,
  book,
  bookSectionCount,
  bookSentenceCount,
  bookProgressPercent,
  isPremiumUser,
  hasWeakWords,
  isAdminUser,
  review,
}: {
  units: LessonUnit[];
  /** Stories-mode lessons — same shape as `units` (lesson cards without sentence bodies, from getHomeLessons). Used only to find the learner's real current/next Stories lesson for the bottom-right card. */
  storiesUnits: LessonUnit[];
  /** The Library's real recommended book (fetchFeaturedBooks()'s first result, or the first published book if nothing is marked featured) — null only when the Library has no published books at all, in which case the top-right card is simply omitted rather than showing empty/fake data. */
  book: Book | null;
  /** `book`'s real section/sentence counts (fetchBookContentCounts) — 0 when `book` is null or has no content yet. */
  bookSectionCount: number;
  bookSentenceCount: number;
  /** This learner's real completion percent for `book` (fetchBookProgressAction) — undefined for "not started yet" or a book with no sentences, matching BookCard's identical convention (see HomeBookCard). */
  bookProgressPercent: number | undefined;
  isPremiumUser: boolean;
  /** Whether this learner currently has any weak/due review words (src/lib/weak-words) — same data NeedsReviewWords shows on Home. Used only to give the "cleared the whole catalog" state below a real next action instead of a dead end. */
  hasWeakWords: boolean;
  /** The Library is admin-only for now — gates the book-recommendation card the same way (dashboard)/library/page.tsx gates the route itself. */
  isAdminUser: boolean;
  /** Home's "review all words" card (NeedsReviewWords, null when nothing is waiting). It sits under the Stories card, so the two together are as tall as the lesson card beside them. */
  review?: ReactNode;
}) {
  const { t, dir } = useLocale();
  const progress = useSharedProgress();
  const { isLoaded, getCompletedIds, startingLevel } = progress;
  const { completedIds, currentLesson, isResumed } = useCurrentLesson(
    units,
    isPremiumUser,
    progress,
  );
  // Not `units.length === 0` (no content authored at all — LessonListView's
  // own empty state handles that): specifically "there IS content, but this
  // learner has exhausted everything they're eligible for right now."
  const noCurrentLesson = units.length > 0 && !currentLesson;

  // The free-lessons-exhausted card fallback: a real, deterministic FREE
  // lesson to keep showing an image-led card instead of a plain text-only
  // completion message, without implying it's unfinished (see
  // MainLessonCardBody's eyebrow/CTA below, not continueLearning/
  // startLearning). Reuses findCurrentLesson itself rather than a second
  // sort/filter — passing `isPremiumUser: false` narrows eligibility to
  // free lessons only (its own `eligible = isPremiumUser ? units :
  // units.filter(isFree)` branch), and passing no completed ids means
  // nothing is excluded, so this always resolves to "the first free lesson
  // in the app's existing level/order sort" (honoring startingLevel exactly
  // like the real current-lesson lookup does) — never a fabricated lesson,
  // and never a mutation of the learner's real completedIds above.
  const freeFallbackLesson =
    noCurrentLesson && !isPremiumUser
      ? findCurrentLesson(units, [], false, startingLevel)
      : undefined;

  const storiesCompletedIds = isLoaded ? getCompletedIds("stories") : [];
  const currentStoryLesson = findCurrentLesson(
    storiesUnits,
    storiesCompletedIds,
    isPremiumUser,
    startingLevel,
  );
  // A story without a picture shows its title in large type on a cover in the site's own grey,
  // with a faint book outline in the corner, so the line under it only repeats the title when the
  // story has no translated one.
  const storyBandTitle = currentStoryLesson?.illustrationUrl
    ? null
    : (currentStoryLesson?.title ?? t.nav.stories);
  const storySubtitle = currentStoryLesson
    ? (currentStoryLesson.supportTitle ?? currentStoryLesson.title)
    : t.marketing.storiesModeDescription;

  if (!isLoaded) {
    return (
      <div className="mb-10 grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <div
          className="bg-muted h-72 w-full animate-pulse rounded-2xl lg:order-2 lg:h-full"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-4 lg:order-1">
          <div
            className="bg-muted h-32 w-full flex-1 animate-pulse rounded-2xl"
            aria-hidden="true"
          />
          <div className="flex flex-1 flex-col empty:hidden">{review}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 grid gap-4 lg:grid-cols-2 lg:items-stretch">
      {/*
        The large primary card — it fills one column on its own (the right one from lg up, via
        order, while on a phone it still comes first) and is a 4:5 picture card from lg up; the
        Stories card plus the review card stack in the other column, and the grid stretches both
        columns to the same height, so the two stacked cards together are exactly as tall as
        this one.
      */}
      <div className="group border-border bg-card relative flex min-h-[26rem] flex-col overflow-hidden rounded-2xl border transition-[scale,translate,box-shadow] duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_22px_40px_-12px_rgba(0,0,0,0.5)] motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.05] lg:order-2 lg:aspect-[4/5] lg:min-h-0">
        {currentLesson && (
          <MainLessonCardBody
            lesson={currentLesson}
            eyebrow={
              isResumed
                ? t.common.resumeLesson
                : completedIds.length > 0
                  ? t.common.continueLearning
                  : t.common.startLearning
            }
            ctaLabel={
              isResumed
                ? t.common.resumeLesson
                : completedIds.length > 0
                  ? t.common.continueLearning
                  : t.common.startLearning
            }
            href={`/learn/normal/${currentLesson.id}`}
            dir={dir}
          />
        )}

        {noCurrentLesson && !isPremiumUser && freeFallbackLesson && (
          // Same image-led card shape as a real current lesson (Section 2B
          // of the fix request: never fall back to a plain text-only
          // completion message) — eyebrow/CTA deliberately say
          // homeFreeCompleteHeading/practice, not continueLearning/
          // startLearning, so this never implies the lesson is
          // unfinished or turns the main button into an upsell; it's an
          // honest "you're done with the starter lessons, here's one to
          // revisit", with a quiet, optional "see Premium plans" step
          // underneath (the footer).
          <MainLessonCardBody
            lesson={freeFallbackLesson}
            eyebrow={t.premium.homeFreeCompleteHeading}
            ctaLabel={t.bookLibrary.practice}
            href={`/learn/normal/${freeFallbackLesson.id}`}
            dir={dir}
            footer={
              // A warm, optional next step: say what Premium adds, promise the
              // progress is safe either way, and keep the button quiet (outline,
              // small) so Practice stays the main thing on the card. Written in
              // white like the rest of the card, since it sits on the picture's shade.
              <div className="mt-3 flex flex-col gap-2 border-t border-white/20 pt-3">
                <p className="line-clamp-3 text-sm leading-snug text-white/75" dir={dir}>
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
        )}

        {noCurrentLesson && !isPremiumUser && !freeFallbackLesson && (
          // Only reachable if the catalog genuinely has zero free lessons at
          // all (every unit premium-only) — freeFallbackLesson can never be
          // fabricated, so this plain message is the sole honest fallback
          // left in that edge case.
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center sm:p-10">
            <div className="bg-brand-muted text-primary flex size-12 items-center justify-center rounded-full">
              <Sparkles className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {t.premium.homeFreeCompleteHeading}
              </h2>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                {t.premium.homeFreeCompleteBody}
              </p>
            </div>
            <Button asChild size="lg" className="mt-1 w-fit">
              <Link href="/upgrade" dir="auto">
                {t.premium.seePlansCta}
              </Link>
            </Button>
          </div>
        )}

        {noCurrentLesson && isPremiumUser && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center sm:p-10">
            <div className="bg-brand-muted text-primary flex size-12 items-center justify-center rounded-full">
              <Trophy className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {t.premium.homeAllDoneHeading}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">{t.premium.homeAllDoneBody}</p>
            </div>
            {hasWeakWords && (
              // The catalog being fully sequential means finishing it used to
              // be a genuine dead end here (text only, no link at all) —
              // this reuses the exact same weak-words review queue
              // NeedsReviewWords/FixYourMistakesSession already maintain, so
              // there's always a real next action once new lessons run out,
              // instead of the learner having nothing to do until new
              // content ships.
              <Button asChild size="lg" className="mt-1 w-fit">
                <Link href="/learn/word-lists/review">{t.lesson.fixMistakes}</Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* The stacked column (left from lg up) — book recommendation above, then Stories and the review card, which take half of the column's height each (Stories takes it all when there is no review card). */}
      <div className="flex flex-col gap-4 lg:order-1">
        {book && isAdminUser && (
          <HomeBookCard
            book={book}
            sectionCount={bookSectionCount}
            sentenceCount={bookSentenceCount}
            progressPercent={bookProgressPercent}
          />
        )}

        <Link
          href="/learn/stories"
          className="group border-border bg-card focus-visible:ring-ring focus-visible:ring-offset-background flex flex-1 flex-col overflow-hidden rounded-2xl border transition-[scale,translate,box-shadow] duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none hover:shadow-[0_22px_40px_-12px_rgba(0,0,0,0.5)] focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.05]"
        >
          <div className="bg-muted relative h-28 w-full shrink-0 overflow-hidden sm:h-32 lg:h-auto lg:min-h-24 lg:flex-1">
            {currentStoryLesson?.illustrationUrl ? (
              // Same plain-<img>/object-cover treatment as HomeBookCard right
              // above it, deliberately not LessonIllustration here: that
              // component's hand-drawn-scene fallback is sized for a full
              // lesson-session panel (hundreds of px tall) and visibly
              // overflows/clips at this card's much smaller h-28/h-32 band —
              // an admin-set photo (this branch) crops fine at any size, but
              // the SVG-scene fallback (the "no photo" case, below) does not,
              // so it gets this card's own treatment instead: a cover in the
              // site's own grey (the same one the review card beside it uses)
              // with a hairline book outline in the brand colour at 22% and
              // the story's title in large type (below).
              // eslint-disable-next-line @next/next/no-img-element -- admin-provided Supabase Storage URL, same choice as LessonIllustration's own <Image>'s source, but at a thumbnail size next/image's pipeline isn't worth the extra config for.
              <img
                src={currentStoryLesson.illustrationUrl}
                alt=""
                className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex items-end bg-[linear-gradient(180deg,var(--muted),var(--card))] p-4">
                <BookOpen
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="text-primary/[0.22] pointer-events-none absolute -end-[6%] -top-[15%] aspect-square h-[131%] max-h-[230px] w-auto [&_path]:[vector-effect:non-scaling-stroke]"
                />
                <span
                  className="text-foreground relative line-clamp-3 text-xl leading-tight font-semibold tracking-tight dark:text-white"
                  dir="ltr"
                >
                  {storyBandTitle}
                </span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-0.5 p-4">
            <h3 className="truncate text-sm font-semibold" dir={dir}>
              {t.nav.stories}
            </h3>
            {storySubtitle !== storyBandTitle && (
              <p className="text-muted-foreground truncate text-xs" dir={dir}>
                {storySubtitle}
              </p>
            )}
            <span className={cn(buttonVariants({ size: "sm" }), "mt-2 w-fit")}>
              {storiesCompletedIds.length > 0 ? t.common.continueLearning : t.common.startLearning}
            </span>
          </div>
        </Link>

        <div className="flex flex-1 flex-col empty:hidden">{review}</div>
      </div>
    </div>
  );
}
