import type { Metadata } from "next";
import { cookies } from "next/headers";

import { FinishPaymentBanner } from "@/components/app/finish-payment-banner";
import { GuestProgressBanner } from "@/components/app/guest-progress-banner";
import { PremiumExpiryBanner } from "@/components/app/premium-expiry-banner";
import { StarterPathProgress } from "@/components/app/starter-path-progress";
import { HomeEngagementSection, HomePassages } from "@/components/app/home-engagement-section";
import { HomeHeaderBar } from "@/components/app/home-header-bar";
import { HomeHero } from "@/components/app/home-hero";
import { HomePlan } from "@/components/app/home-plan";
import { HomeReviewCard } from "@/components/app/home-review-card";
import { NeedsReviewWords } from "@/components/app/needs-review-words";
import { ProgressProvider } from "@/components/providers/progress-provider";
import { TodayHomePage } from "@/components/today/today-home-page";
import { isAdmin } from "@/lib/admin/access";
import { getAccessState } from "@/lib/billing/access";
import { REMINDER_WINDOW_DAYS } from "@/lib/billing/expiry-reminders";
import { getOpenCheckout } from "@/lib/billing/open-checkout";
import { getHomeLessons } from "@/lib/content";
import { startHomeEngagement } from "@/lib/features/home-engagement";
import { loadHomePlanWords } from "@/lib/home-plan/words";
import { localISODateInTimeZone, TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { startHomePassagesCard } from "@/lib/passages/home-card";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";
import { fetchBookProgressAction } from "@/lib/book-progress/actions";
import { fetchFeaturedBooks, fetchFirstPublishedBook } from "@/lib/supabase/queries/library";
import { fetchBookContentCounts } from "@/lib/supabase/queries/book-content";
import { fetchAttemptCount } from "@/lib/supabase/queries/progress";
import { fetchWeakWordsAction } from "@/lib/weak-words/actions";
import { countWordsWaitingForReview } from "@/lib/word-mastery/queue";
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
export default async function LearnHomePage({
  searchParams,
}: {
  searchParams: Promise<{ classic?: string }>;
}) {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  // "Today's session (new Home)": a signed-in learner it is open for gets the Today card instead of
  // everything below; ?classic=1 (the "Choose yourself" link) brings the old Home back. Decided
  // before any of the old page's reads start, so the Today page does not pay for them.
  const [homeFeatures, homeUser, homeParams] = await Promise.all([
    getEffectiveFeatures(),
    getCurrentUser(),
    searchParams,
  ]);
  if (homeFeatures.rollouts.todaySession && homeUser && homeParams.classic !== "1") {
    return (
      <TodayHomePage
        userId={homeUser.id}
        locale={locale}
        floor={homeFeatures.rollouts.levelFloor}
      />
    );
  }

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
  // A payment link this learner left open, for the "finish your payment" note.
  const openCheckoutPromise = userPromise.then((user) => (user ? getOpenCheckout(user.id) : null));
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
  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const learnerToday = localISODateInTimeZone(timeZone);
  const weakWordsPromise = fetchWeakWordsAction();
  // The same number the Word Lists hero shows (see countWordsWaitingForReview) —
  // only what is actually up for review, not every word that was ever weak.
  const reviewWaitingPromise = weakWordsPromise.then(countWordsWaitingForReview);
  const engagement = startHomeEngagement({
    todayISO: learnerToday,
    features: getEffectiveFeatures(),
    user: userPromise,
    // Swallowed here only for the count: the page's own await below still surfaces a real failure.
    weakWordCount: weakWordsPromise.then((words) => words.length).catch(() => 0),
  });
  // The Passages card needs no time zone, so unlike the cards above it starts on every visit and
  // always renders under the "Up next" heading, whichever way the other cards were loaded.
  const passages = startHomePassagesCard({ user: userPromise, features: getEffectiveFeatures() });
  // Admin preview of "Today's plan" (HomePlan): its Word Lists reads only run for an admin.
  const isAdminPromise = isAdmin();
  const planWordsPromise = Promise.all([
    isAdminPromise,
    userPromise,
    progressPromise,
    getEffectiveFeatures(),
  ]).then(([admin, signedIn, progress, effectiveFeatures]) =>
    admin && signedIn
      ? loadHomePlanWords({
          userId: signedIn.id,
          locale: locale ?? undefined,
          timeZone,
          isPremiumUser: true,
          startingLevel: progress?.startingLevel ?? null,
          floor: effectiveFeatures.rollouts.levelFloor,
        })
      : null,
  );
  const [
    { units, storiesUnits, lessonStats },
    access,
    isAdminUser,
    user,
    attemptCount,
    featuredBooks,
    fallbackBook,
    weakWords,
    reviewWaiting,
    initialProgress,
    openCheckout,
    planWords,
  ] = await Promise.all([
    getHomeLessons(locale ?? undefined),
    getAccessState(),
    isAdminPromise,
    userPromise,
    attemptCountPromise,
    fetchFeaturedBooks(supabase, locale),
    fetchFirstPublishedBook(supabase, locale),
    weakWordsPromise,
    reviewWaitingPromise,
    progressPromise,
    openCheckoutPromise,
    planWordsPromise,
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
  // the card HomeHero renders from them anyway. Admins now see the plan instead
  // of HomeHero (admin preview), so they skip these queries too.
  const showHomePlan = isAdminUser;
  if (recommendedBook && isAdminUser && !showHomePlan) {
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

  const isPremiumUser = access.isPremium || isAdminUser;
  // Only a real, dated paid period can end — the sitewide free-access promotion
  // and the dev override have no end date, so they never get the banner.
  const expiryEndsAt =
    access.isPremium &&
    access.expiresAt &&
    new Date(access.expiresAt).getTime() > Date.now() &&
    new Date(access.expiresAt).getTime() - Date.now() <= REMINDER_WINDOW_DAYS * 86_400_000
      ? access.expiresAt
      : null;

  // The review card sits under the Stories card inside "Up next", drawn like it (HomeReviewCard) —
  // in the admin preview it stays the Word Lists page's own full-width card, under the plan.
  const reviewWords = weakWords.filter((word) => word.dueNow);

  return (
    <ProgressProvider initialProgress={initialProgress}>
      <div className="mx-auto max-w-5xl px-6 pt-4 pb-12 max-sm:flex max-sm:flex-col sm:pt-6 sm:pb-16">
        <h1 className="sr-only">{t.nav.home}</h1>
        <HomeHeaderBar
          user={user}
          lessonStats={lessonStats}
          sessionCount={attemptCount}
          className="mb-10 max-sm:order-1 max-sm:mb-6"
        />
        <div className="max-sm:order-4">
          <GuestProgressBanner isGuest={!user} className="mb-6" />
          {expiryEndsAt && <PremiumExpiryBanner endsAt={expiryEndsAt} className="mb-6" />}
          {openCheckout && !isPremiumUser && (
            <FinishPaymentBanner
              reference={openCheckout.reference}
              url={openCheckout.url}
              className="mb-6"
            />
          )}
        </div>
        {/* A direct child of the page (not nested in the wrappers around it) so that on a phone
            (max-sm) today's streak + quests sit right under the greeting/stats header and above
            "up next". From sm: up it stays exactly where it was in the DOM flow, between the
            banners and "up next". */}
        <HomeEngagementSection stream={engagement} className="mb-6 max-sm:order-2" />
        <div className="max-sm:order-3">
          {showHomePlan ? (
            <>
              <HomePassages data={passages} className="mb-6" />
              <HomePlan
                units={units}
                storiesUnits={storiesUnits}
                words={planWords}
                isPremiumUser={isPremiumUser}
              />
            </>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <h2 className="text-lg font-semibold tracking-tight">{t.progress.upNextLabel}</h2>
                {!isPremiumUser && <StarterPathProgress units={units} />}
              </div>
              <HomePassages data={passages} className="mb-4" />
              <HomeHero
                units={units}
                storiesUnits={storiesUnits}
                book={recommendedBook}
                bookSectionCount={bookSectionCount}
                bookSentenceCount={bookSentenceCount}
                bookProgressPercent={bookProgressPercent}
                isPremiumUser={isPremiumUser}
                hasWeakWords={reviewWaiting.count > 0}
                isAdminUser={isAdminUser}
                review={
                  <HomeReviewCard
                    words={reviewWords}
                    count={reviewWaiting.count}
                    smart={reviewWaiting.smart}
                  />
                }
              />
            </>
          )}
        </div>
        {showHomePlan && (
          <div className="max-sm:order-4">
            <NeedsReviewWords
              words={reviewWords}
              count={reviewWaiting.count}
              smart={reviewWaiting.smart}
            />
          </div>
        )}
      </div>
    </ProgressProvider>
  );
}
