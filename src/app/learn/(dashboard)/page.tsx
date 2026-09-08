import type { Metadata } from "next";

import { HomeHero, type LessonStatsMap } from "@/components/app/home-hero";
import { HomeSummary } from "@/components/app/home-summary";
import { NeedsReviewWords } from "@/components/app/needs-review-words";
import { SavedSentenceCard } from "@/components/app/saved-sentence-card";
import { ProgressProvider } from "@/components/providers/progress-provider";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLessons } from "@/lib/content";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { LEARNING_MODES } from "@/lib/learning-modes";
import { stableIndex } from "@/lib/utils";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";
import { fetchBookProgressAction } from "@/lib/book-progress/actions";
import { fetchFeaturedBooks, fetchFirstPublishedBook } from "@/lib/supabase/queries/library";
import { fetchBookContentCounts } from "@/lib/supabase/queries/book-content";
import { fetchAttemptCount } from "@/lib/supabase/queries/progress";
import { fetchMySavedSentences } from "@/lib/supabase/queries/saved-sentences";
import { fetchWeakWordsAction } from "@/lib/weak-words/actions";
import type { Book } from "@/types/library";

export const metadata: Metadata = { title: "Home" };

/**
 * Reads live content/progress on every request — same "no build-time cache
 * over admin CMS changes or a real subscriber's unlocked state" reasoning as
 * /upgrade and the [mode] list pages.
 */
export const dynamic = "force-dynamic";

/**
 * The Home dashboard, split out of /learn/normal (Home dashboard/Ordinary
 * Lessons separation): this route used to redirect straight into the
 * Ordinary Lessons list, with the actual greeting/stats/"up next" dashboard
 * bolted onto the top of that list page — one page serving two different
 * intents ("show me my progress" vs "let me browse a specific lesson"),
 * which is exactly what made Home feel crowded. Ordinary Lessons is now its
 * own sibling route (/learn/normal, structurally consistent with /learn/
 * stories, /learn/word-lists, /learn/library — see learn-sidebar.tsx's own
 * nav order), and this page is purely the dashboard: nothing here scrolls
 * into a lesson catalog any more.
 */
export default async function LearnHomePage() {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  // Every fetch below is independent of every other (the only real
  // dependency in this whole page is book counts/progress needing to know
  // which book got recommended first — see further down), so they all fire
  // in one single batch rather than two sequential ones. This used to be
  // split into two separate `await Promise.all([...])` calls — a leftover
  // from when the second batch was added later and just tacked on below the
  // first — which meant the second batch's four queries didn't even start
  // until every query in the first batch had already finished, adding a
  // full extra network round-trip of pure waiting to every load. That's
  // what made Home noticeably slower to open than /learn/normal (etc.),
  // which does the equivalent of just one such batch. attemptCount is the
  // only entry that genuinely depends on another value here (the signed-in
  // user's id) — chaining it off userPromise instead of awaiting user first
  // lets it still join this same parallel batch instead of forcing its own
  // sequential stage.
  const supabase = isSupabaseConfigured() ? createPublicClient() : undefined;
  const userPromise = getCurrentUser();
  const attemptCountPromise = userPromise.then((user) =>
    user ? fetchAttemptCount(user.id) : null,
  );
  // A small pool (not the whole library) to pick today's resurfaced saved
  // sentence from — see savedSpotlight below. null for a guest/no saves,
  // which the render simply omits rather than showing an empty widget.
  const savedPoolPromise = userPromise.then((user) =>
    user ? fetchMySavedSentences(user.id, { limit: 10, locale: locale ?? undefined }) : null,
  );
  const [
    units,
    hasPremium,
    isAdminUser,
    user,
    storiesLessons,
    conversationLessons,
    attemptCount,
    featuredBooks,
    weakWords,
    savedPool,
  ] = await Promise.all([
    getLessons("normal", locale ?? undefined),
    hasPremiumAccess(),
    isAdmin(),
    userPromise,
    getLessons("stories", locale ?? undefined),
    getLessons("conversation", locale ?? undefined),
    attemptCountPromise,
    fetchFeaturedBooks(supabase),
    fetchWeakWordsAction(),
    savedPoolPromise,
  ]);

  const byMode = { normal: units, stories: storiesLessons, conversation: conversationLessons };
  const lessonStats: LessonStatsMap = {};
  for (const lessonMode of LEARNING_MODES) {
    for (const lesson of byMode[lessonMode]) {
      const words = lesson.sentences.reduce(
        (sum, sentence) => sum + sentence.en.trim().split(/\s+/).filter(Boolean).length,
        0,
      );
      lessonStats[`${lessonMode}:${lesson.id}`] = { sentences: lesson.sentences.length, words };
    }
  }

  // The Book recommendation card: the first featured, published book, or
  // the Library's first published book at all if none is explicitly marked
  // featured yet (see fetchFirstPublishedBook's doc comment for why that's
  // its own lightweight query rather than reusing the Library homepage's
  // full category-scan). Null only when the Library has no published books
  // whatsoever, in which case HomeHero simply omits that card rather than
  // showing empty/fake data.
  const recommendedBook: Book | null =
    featuredBooks[0] ?? (await fetchFirstPublishedBook(supabase));

  let bookSectionCount = 0;
  let bookSentenceCount = 0;
  let bookProgressPercent: number | undefined;
  if (recommendedBook) {
    const [counts, progress] = await Promise.all([
      fetchBookContentCounts(recommendedBook.id, supabase),
      fetchBookProgressAction(recommendedBook.id),
    ]);
    bookSectionCount = counts.sectionCount;
    bookSentenceCount = counts.sentenceCount;
    bookProgressPercent =
      counts.sentenceCount > 0
        ? Math.min(100, (progress.completedSentenceCount / counts.sentenceCount) * 100)
        : undefined;
  }

  const isPremiumUser = hasPremium || isAdminUser;

  // Stable per calendar day (not per request) so refreshing the dashboard
  // doesn't shuffle the pick mid-day — a resurfaced memory that changes
  // every reload would read as random noise rather than "today's" pick.
  const todayKey = new Date().toISOString().slice(0, 10);
  const savedSpotlight =
    savedPool && savedPool.items.length > 0
      ? savedPool.items[stableIndex(todayKey, savedPool.items.length)]
      : null;

  return (
    <ProgressProvider>
      <div className="mx-auto max-w-5xl px-6 pt-4 pb-12 sm:pt-6 sm:pb-16">
        <HomeSummary
          displayName={user?.displayName ?? null}
          units={units}
          isPremiumUser={isPremiumUser}
          lessonStats={lessonStats}
          sessionCount={attemptCount}
          className="mb-8"
        />
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          {t.progress.upNextLabel}
        </p>
        <HomeHero
          units={units}
          storiesUnits={storiesLessons}
          book={recommendedBook}
          bookSectionCount={bookSectionCount}
          bookSentenceCount={bookSentenceCount}
          bookProgressPercent={bookProgressPercent}
          isPremiumUser={isPremiumUser}
        />
        <NeedsReviewWords words={weakWords} />
        {savedSpotlight && (
          <div className="mt-8">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              {t.bookLibrary.savedSpotlightLabel}
            </p>
            <SavedSentenceCard item={savedSpotlight} />
          </div>
        )}
      </div>
    </ProgressProvider>
  );
}
