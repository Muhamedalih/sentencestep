"use client";

import Link from "next/link";
import { Sparkles, Trophy } from "lucide-react";

import { HomeBookCard } from "@/components/app/home-book-card";
import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { formatPrice } from "@/lib/billing/pricing";
import { findCurrentLesson } from "@/lib/progress/level";
import type { LessonUnit } from "@/types/content";
import type { Book } from "@/types/library";

/** Sentence/word totals for one lesson, keyed by `${mode}:${lessonId}` — see (dashboard)/[mode]/page.tsx, which derives this once from the same lesson content it already fetches for the lesson list, no extra queries. Also consumed by DashboardSummary for its Sessions/Lines/Words tiles (see that component's own doc comment). */
export type LessonStatsMap = Record<string, { sentences: number; words: number }>;

/**
 * The large card's actual image+text content — shared by the real
 * current-lesson state and the free-lessons-exhausted fallback below (same
 * JSX either way, just a different lesson/eyebrow/CTA), so fixing or
 * restyling this layout never means keeping two copies in sync.
 */
function MainLessonCardBody({
  lesson,
  eyebrow,
  ctaLabel,
  href,
  dir,
}: {
  lesson: LessonUnit;
  eyebrow: string;
  ctaLabel: string;
  href: string;
  dir: "rtl" | "ltr";
}) {
  return (
    <>
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
        <LessonIllustration
          mode="normal"
          lessonId={lesson.id}
          title={lesson.title}
          illustrationUrl={lesson.illustrationUrl}
          className="aspect-[16/10] w-full"
        />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 p-6 sm:p-8">
        <p className="text-muted-foreground text-sm font-medium" dir={dir}>
          {eyebrow}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" dir="ltr">
          {lesson.title}
        </h2>
        <p className="text-muted-foreground text-sm" dir={dir}>
          {lesson.supportTitle ?? lesson.title}
        </p>
        {lesson.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm" dir="ltr">
            {lesson.description}
          </p>
        )}
        {lesson.supportDescription && (
          <p className="text-muted-foreground line-clamp-2 text-sm" dir={dir}>
            {lesson.supportDescription}
          </p>
        )}
        <Button asChild size="lg" className="mt-2 w-fit">
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </div>
    </>
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
 * moved to DashboardSummary at the top of the page (see that component's own
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
}: {
  units: LessonUnit[];
  /** Stories-mode lessons — same shape/fetch as `units`, already resolved server-side by (dashboard)/[mode]/page.tsx (it fetches all three modes' content for lessonStats already; this is that same array, not a new query). Used only to find the learner's real current/next Stories lesson for the bottom-right card. */
  storiesUnits: LessonUnit[];
  /** The Library's real recommended book (fetchFeaturedBooks()'s first result, or the first published book if nothing is marked featured) — null only when the Library has no published books at all, in which case the top-right card is simply omitted rather than showing empty/fake data. */
  book: Book | null;
  /** `book`'s real section/sentence counts (fetchBookContentCounts) — 0 when `book` is null or has no content yet. */
  bookSectionCount: number;
  bookSentenceCount: number;
  /** This learner's real completion percent for `book` (fetchBookProgressAction) — undefined for "not started yet" or a book with no sentences, matching BookCard's identical convention (see HomeBookCard). */
  bookProgressPercent: number | undefined;
  isPremiumUser: boolean;
}) {
  const { t, dir } = useLocale();
  const progress = useSharedProgress();
  const { isLoaded, getCompletedIds, startingLevel } = progress;
  const { completedIds, currentLesson } = useCurrentLesson(units, isPremiumUser, progress);
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

  if (!isLoaded) {
    return (
      <div className="mb-10 grid gap-4 lg:grid-cols-2" aria-hidden="true">
        <div className="bg-muted h-72 w-full animate-pulse rounded-2xl lg:h-full" />
        <div className="flex flex-col gap-4">
          <div className="bg-muted h-32 w-full flex-1 animate-pulse rounded-2xl" />
          <div className="bg-muted h-32 w-full flex-1 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 grid gap-4 lg:grid-cols-2 lg:items-stretch">
      {/*
        The large primary card — significantly bigger than either card in
        the right column individually, and roughly matching their COMBINED
        area (equal grid columns, right column split into two equal-height
        stacked cards) rather than an arbitrarily large/small ratio.
      */}
      <div className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow] duration-300 ease-out hover:shadow-lg motion-safe:hover:-translate-y-1">
        {currentLesson && (
          <MainLessonCardBody
            lesson={currentLesson}
            eyebrow={completedIds.length > 0 ? t.common.continueLearning : t.common.startLearning}
            ctaLabel={completedIds.length > 0 ? t.common.continueLearning : t.common.startLearning}
            href={`/learn/normal/${currentLesson.id}`}
            dir={dir}
          />
        )}

        {noCurrentLesson && !isPremiumUser && freeFallbackLesson && (
          // Same image-led card shape as a real current lesson (Section 2B
          // of the fix request: never fall back to a plain text-only
          // completion message) — eyebrow/CTA deliberately say
          // homeFreeCompleteHeading/practice, not continueLearning/
          // startLearning/upgradeCta, so this never implies the lesson is
          // unfinished or silently swaps in the upsell flow; it's an honest
          // "you're done with free content, here's one to revisit."
          <MainLessonCardBody
            lesson={freeFallbackLesson}
            eyebrow={t.premium.homeFreeCompleteHeading}
            ctaLabel={t.bookLibrary.practice}
            href={`/learn/normal/${freeFallbackLesson.id}`}
            dir={dir}
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
              <Link href="/upgrade">{t.premium.upgradeCta.replace("{price}", formatPrice())}</Link>
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
          </div>
        )}
      </div>

      {/* Right column — book recommendation above, Stories below, matching dimensions/spacing. */}
      <div className="flex flex-col gap-4">
        {book && (
          <HomeBookCard
            book={book}
            sectionCount={bookSectionCount}
            sentenceCount={bookSentenceCount}
            progressPercent={bookProgressPercent}
          />
        )}

        <Link
          href="/learn/stories"
          className="group border-border bg-card focus-visible:ring-ring focus-visible:ring-offset-background flex flex-1 flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow] duration-300 ease-out outline-none hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1"
        >
          <div className="bg-muted relative h-28 w-full shrink-0 overflow-hidden sm:h-32">
            {currentStoryLesson?.illustrationUrl ? (
              // Same plain-<img>/object-cover treatment as HomeBookCard right
              // above it, deliberately not LessonIllustration here: that
              // component's hand-drawn-scene fallback is sized for a full
              // lesson-session panel (hundreds of px tall) and visibly
              // overflows/clips at this card's much smaller h-28/h-32 band —
              // an admin-set photo (this branch) crops fine at any size, but
              // the SVG-scene fallback (the "no photo" case, below) does not,
              // so it gets this card's own compact icon+gradient treatment
              // instead, matching HomeBookCard's identical "no cover" state.
              // eslint-disable-next-line @next/next/no-img-element -- admin-provided Supabase Storage URL, same choice as LessonIllustration's own <Image>'s source, but at a thumbnail size next/image's pipeline isn't worth the extra config for.
              <img
                src={currentStoryLesson.illustrationUrl}
                alt=""
                className="size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
              />
            ) : (
              <div className="from-brand-muted to-muted flex size-full items-center justify-center bg-gradient-to-br">
                <Sparkles className="text-muted-foreground/50 size-8" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center gap-0.5 p-4">
            <h3 className="truncate text-sm font-semibold" dir={dir}>
              {t.nav.stories}
            </h3>
            <p className="text-muted-foreground truncate text-xs" dir={dir}>
              {currentStoryLesson
                ? (currentStoryLesson.supportTitle ?? currentStoryLesson.title)
                : t.marketing.storiesModeDescription}
            </p>
            <span className="text-primary mt-1.5 text-xs font-semibold">
              {storiesCompletedIds.length > 0 ? t.common.continueLearning : t.common.startLearning}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
