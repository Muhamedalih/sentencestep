import type { Metadata } from "next";
import { cookies } from "next/headers";

import { GuestProgressBanner } from "@/components/app/guest-progress-banner";
import { HomeEngagementSection } from "@/components/app/home-engagement-section";
import { HomeHeaderBar } from "@/components/app/home-header-bar";
import { HomeHero } from "@/components/app/home-hero";
import { NeedsReviewWords } from "@/components/app/needs-review-words";
import { ProgressProvider } from "@/components/providers/progress-provider";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getHomeLessons } from "@/lib/content";
import { startHomeEngagement } from "@/lib/features/home-engagement";
import { localISODateInTimeZone, TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";
import { fetchBookProgressAction } from "@/lib/book-progress/actions";
import { fetchFeaturedBooks, fetchFirstPublishedBook } from "@/lib/supabase/queries/library";
import { fetchBookContentCounts } from "@/lib/supabase/queries/book-content";
import { fetchAttemptCount } from "@/lib/supabase/queries/progress";
import { fetchWeakWordsAction } from "@/lib/weak-words/actions";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
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

  // The lesson catalog comes from getHomeLessons — lesson cards plus per-lesson
  // sentence/word counts, never the sentence bodies themselves (see that
  // function's doc comment: Home used to pull every sentence of every mode,
  // with word translations, and ship them all to the browser).
  //
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
  //
  // fetchFirstPublishedBook (the `fallbackBook` entry below) also joins this
  // same batch unconditionally now, rather than only being fetched after learning
  // featuredBooks came back empty: measured production timing showed each
  // Supabase round trip on this page costs ~200-500ms, so a sequential
  // "fetch featured, then fetch fallback" second stage was adding a full
  // extra round trip specifically on every load with no explicitly featured
  // book yet (the common state until an admin marks one — see
  // fetchFirstPublishedBook's doc comment). Firing it in parallel instead
  // means it's hidden entirely under whichever other query in this batch
  // takes longest, at the cost of
  // one extra always-issued, cheap, indexed single-row query that goes
  // unused whenever a featured book already exists. That trade is worth it
  // here: the discarded query is a `select("*") ... limit(1)`, not a scan,
  // while the round trip it replaces was a real, measured, guaranteed delay.
  const supabase = isSupabaseConfigured() ? createPublicClient() : undefined;
  const userPromise = getCurrentUser();
  const attemptCountPromise = userPromise.then((user) =>
    user ? fetchAttemptCount(user.id) : null,
  );
  // Prefetches the same data useProgress() would otherwise only fetch
  // client-side after hydration (see ProgressProvider below) — folded into
  // this same parallel batch rather than a separate round trip once the
  // page reaches the browser, which is what used to leave HomeHeaderBar/
  // HomeHero stuck on their skeleton state for a full extra network hop on
  // every load. `todayISO` here is the SERVER's local calendar date, not
  // this learner's own (see fetchProgressAction's own doc comment on why
  // that distinction normally matters) — accepted here because the only
  // field it affects is dailyProgress's "goal met today" ring on
  // HomeHeaderBar, which self-corrects the moment this learner completes a
  // lesson (recordCompletionAction always recomputes it from their real
  // local date) or reloads this page after their own midnight has passed.
  // Getting the learner's true local date would need a second client-side
  // fetch to reconcile it, which would just reintroduce the extra Supabase
  // round trip this exists to remove.
  const todayISO = todayLocalISODate();
  const progressPromise = userPromise.then((user) =>
    user ? fetchProgressCached(todayISO) : undefined,
  );
  // The engagement cards (today's session, quests, streak strip) load HERE,
  // alongside everything above, instead of in the browser after hydration —
  // there they were three separate Server Actions that Next queues one behind
  // the other, each re-resolving features and the session, which is what made
  // Home feel slow the moment they were added. They are keyed by the learner's
  // LOCAL date, which the server derives from the time zone the browser left
  // in a cookie (see TimezoneCookie); without that cookie yet (first ever
  // visit) the cards fall back to one browser request. Each card streams in
  // through its own <Suspense> slot (see HomeEngagementSection), so a slow one
  // never holds back the rest of the page or the other cards. weakWordsPromise
  // is shared so the session count doesn't redo it.
  const learnerToday = localISODateInTimeZone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const weakWordsPromise = fetchWeakWordsAction();
  const engagement = startHomeEngagement({
    todayISO: learnerToday,
    features: getEffectiveFeatures(),
    user: userPromise,
    // Swallowed here only for the count: the page's own await below still surfaces a real failure.
    weakWordCount: weakWordsPromise.then((words) => words.length).catch(() => 0),
  });
  const [
    { units, storiesUnits, lessonStats },
    hasPremium,
    isAdminUser,
    user,
    attemptCount,
    featuredBooks,
    fallbackBook,
    weakWords,
    initialProgress,
  ] = await Promise.all([
    getHomeLessons(locale ?? undefined),
    hasPremiumAccess(),
    isAdmin(),
    userPromise,
    attemptCountPromise,
    fetchFeaturedBooks(supabase, locale),
    fetchFirstPublishedBook(supabase, locale),
    weakWordsPromise,
    progressPromise,
  ]);

  // The Book recommendation card: the first featured, published book, or
  // the Library's first published book at all if none is explicitly marked
  // featured yet (see fetchFirstPublishedBook's doc comment for why that's
  // its own lightweight query rather than reusing the Library homepage's
  // full category-scan). Null only when the Library has no published books
  // whatsoever, in which case HomeHero simply omits that card rather than
  // showing empty/fake data.
  const recommendedBook: Book | null = featuredBooks[0] ?? fallbackBook;

  let bookSectionCount = 0;
  let bookSentenceCount = 0;
  let bookProgressPercent: number | undefined;
  // The Library (and this book-recommendation card into it) is admin-only
  // for now — skip its extra queries for a regular learner, who'd never see
  // the card HomeHero renders from them anyway.
  if (recommendedBook && isAdminUser) {
    // countsPromise is shared with fetchBookProgressAction below (instead of
    // each independently calling fetchBookContentCounts) — see that
    // function's own doc comment for why it used to redundantly re-run the
    // exact same book_sections/book_sentences count query a second time.
    const countsPromise = fetchBookContentCounts(recommendedBook.id, supabase);
    const [counts, progress] = await Promise.all([
      countsPromise,
      fetchBookProgressAction(recommendedBook.id, countsPromise),
    ]);
    bookSectionCount = counts.sectionCount;
    bookSentenceCount = counts.sentenceCount;
    bookProgressPercent =
      counts.sentenceCount > 0
        ? Math.min(100, (progress.completedSentenceCount / counts.sentenceCount) * 100)
        : undefined;
  }

  const isPremiumUser = hasPremium || isAdminUser;

  return (
    <ProgressProvider initialProgress={initialProgress}>
      <div className="mx-auto max-w-5xl px-6 pt-4 pb-12 sm:pt-6 sm:pb-16">
        <HomeHeaderBar
          user={user}
          lessonStats={lessonStats}
          sessionCount={attemptCount}
          className="mb-10"
        />
        <GuestProgressBanner isGuest={!user} className="mb-6" />
        <HomeEngagementSection stream={engagement} className="mb-6" />
        <NeedsReviewWords words={weakWords} />
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          {t.progress.upNextLabel}
        </p>
        <HomeHero
          units={units}
          storiesUnits={storiesUnits}
          book={recommendedBook}
          bookSectionCount={bookSectionCount}
          bookSentenceCount={bookSentenceCount}
          bookProgressPercent={bookProgressPercent}
          isPremiumUser={isPremiumUser}
          hasWeakWords={weakWords.length > 0}
          isAdminUser={isAdminUser}
        />
      </div>
    </ProgressProvider>
  );
}
