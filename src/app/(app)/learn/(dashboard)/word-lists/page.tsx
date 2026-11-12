import type { Metadata } from "next";

import { WordListsLibrary } from "@/components/app/word-lists-library";
import { CoreWordsShelf } from "@/components/words/core-words-shelf";
import { WordsHubPage } from "@/components/words/words-hub-page";
import { WordListsDashboard } from "@/components/words/word-lists-dashboard";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchWordCardHints } from "@/lib/supabase/queries/word-hints";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchWeakWordsAction } from "@/lib/weak-words/actions";
import { loadBankWordLists } from "@/lib/word-bank/card-load";
import { getWordGroupSummaries } from "@/lib/word-lists";
import {
  getLearnerToday,
  getSmartWordsAccess,
  getWordsRedesignEnabled,
} from "@/lib/word-mastery/access";
import { readMasteryStates, summarizeLibraryMastery } from "@/lib/word-mastery/queue";
import type { LibraryMastery } from "@/lib/word-mastery/types";

// Same reasoning as /learn/[mode] and /learn/stories: premium access is
// cookie/session-derived, so this page must never be statically cached —
// see src/app/learn/[mode]/page.tsx's doc comment for the specific bug
// this guards against.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Word Lists" };

export default async function WordListsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  // The one Words page («الكلمات», permission wordsPage): the topics, the core words and (through its
  // tabs) the saved words under one title. Everyone else keeps the library below, as it always was.
  if ((await getEffectiveFeatures()).rollouts.wordsPage) {
    return <WordsHubPage tab={(await searchParams).tab} />;
  }

  const locale = await getLocale();
  const [groups, hasPremium, isAdminUser, weakWords, access, redesign, features] =
    await Promise.all([
      getWordGroupSummaries(locale ?? undefined),
      hasPremiumAccess(),
      isAdmin(),
      fetchWeakWordsAction(),
      getSmartWordsAccess(),
      getWordsRedesignEnabled(),
      getEffectiveFeatures(),
    ]);

  // Smart word practice, signed-in learners only (the schedule needs an
  // account): each card's mastery and the number of words waiting for review.
  // A failure to read the schedule reads as "nothing scheduled yet".
  let mastery: LibraryMastery | null = null;
  if (access.spaced && access.userId) {
    const [states, today] = await Promise.all([
      readMasteryStates(access.userId),
      getLearnerToday(),
    ]);
    mastery = summarizeLibraryMastery(groups, states, today, weakWords);
  }

  // While the Home cards are open for a signed-in learner (permission "homeCards"), the library's review
  // card is Home's words section, so the two pages show the same thing. It needs what Home reads for it:
  // the Arabic meaning of the first four due words (one small read by id, an Arabic learner only; a failed
  // read just leaves the meanings out). A learner without it keeps the card the page always had.
  // "Signed in" is the session the features were resolved for, NOT Smart word practice's account: that
  // feature is admin-controlled, so tying the card to it showed the new card to admins only.
  const homeCards = features.rollouts.homeCards && features.signedIn;
  const homeCardWords = homeCards
    ? locale === "ar"
      ? await fetchWordCardHints(
          weakWords
            .filter((word) => word.dueNow)
            .slice(0, 4)
            .map((word) => word.wordId),
        )
      : {}
    : null;

  // For a learner the words bank («كلماتي») is open to, ONE read of their own rows gives both: the card
  // shows today's words of the bank on a day it has some (exactly as on Home), and the core-words shelf
  // under it shows where they stand on the site's most frequent words.
  const user = features.rollouts.wordBank ? await getCurrentUser() : null;
  const bankLists = user ? await loadBankWordLists(user.id, await getLearnerToday()) : null;
  const homeCardBank = homeCards ? (bankLists?.card ?? null) : null;
  const coreShelf = bankLists ? (
    <CoreWordsShelf data={bankLists.shelf} isPremiumUser={hasPremium || isAdminUser} />
  ) : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      {/* The redesigned dashboard is admin-controlled ("Word Lists redesign" in /admin/features):
          everyone else keeps the library exactly as it was. */}
      {redesign ? (
        <WordListsDashboard
          groups={groups}
          isPremiumUser={hasPremium || isAdminUser}
          weakWords={weakWords}
          mastery={mastery}
          homeCardWords={homeCardWords}
        />
      ) : (
        <WordListsLibrary
          groups={groups}
          isPremiumUser={hasPremium || isAdminUser}
          weakWords={weakWords}
          mastery={mastery}
          homeCardWords={homeCardWords}
          homeCardBank={homeCardBank}
          shelf={coreShelf}
        />
      )}
    </div>
  );
}
