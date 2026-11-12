import { BookOpen } from "lucide-react";

import { CoreWordsShelf } from "@/components/words/core-words-shelf";
import { WordsHubHeader } from "@/components/words/words-hub-header";
import { WordsReviewStrip } from "@/components/words/words-review-strip";
import { WordsTopicGrid } from "@/components/words/words-topic-grid";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchBankStates, isMissingBankSchema } from "@/lib/supabase/queries/learner-words";
import { loadBankWordLists } from "@/lib/word-bank/card-load";
import { bankOverview } from "@/lib/word-bank/shelves";
import type { BankOverview } from "@/lib/word-bank/shelves";
import { bankStrings } from "@/lib/word-bank/strings";
import { getWordGroupSummaries } from "@/lib/word-lists";
import { getLearnerToday } from "@/lib/word-mastery/access";
import { availableTabs, parseListsTab, showsTabs } from "@/lib/words-hub/tabs";

/**
 * The one Words page («الكلمات», the wordsPage permission) at `/learn/word-lists`: the title with its
 * tabs, then either the topics (with the strip of words waiting for review above them, for a
 * learner the words bank is open to) or, on `?tab=core`, the core words. The Saved tab is its own
 * page, drawn under the same head (see the saved words route). Everything it shows already
 * existed: the page only brings it to one address.
 */
export async function WordsHubPage({ tab: tabParam }: { tab: unknown }) {
  const [features, locale, user] = await Promise.all([
    getEffectiveFeatures(),
    getLocale(),
    getCurrentUser(),
  ]);
  const bankOpen = features.rollouts.wordBank && Boolean(user);
  const available = { core: bankOpen, saved: Boolean(user) && features.personalCards.page };
  const tab = parseListsTab(tabParam, available);
  const tabs = showsTabs(available) ? availableTabs(available) : (["groups"] as const);
  const t = locale ? getDictionary(locale) : fallbackDictionary;
  const [hasPremium, isAdminUser] = await Promise.all([hasPremiumAccess(), isAdmin()]);
  const premium = hasPremium || isAdminUser;
  const todayISO = bankOpen ? await getLearnerToday() : "";

  let body;
  if (tab === "core" && user) {
    const { shelf } = await loadBankWordLists(user.id, todayISO);
    body = <CoreWordsShelf data={shelf} isPremiumUser={premium} className="mt-1" />;
  } else {
    const groups = await getWordGroupSummaries(locale ?? undefined);
    let overview: BankOverview | null = null;
    if (bankOpen && user) {
      overview = await fetchBankStates(user.id)
        .then((states) => bankOverview(states, todayISO))
        .catch((error: unknown) => {
          if (!isMissingBankSchema(error)) {
            console.error("[word-bank] reading the bank failed", error);
          }
          return null;
        });
    }
    body = (
      <>
        {overview && (
          <WordsReviewStrip
            overview={overview}
            todayISO={todayISO}
            locale={locale}
            t={t}
            s={bankStrings(locale)}
          />
        )}
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
              <BookOpen className="size-7" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium">{t.library.wordListsEmptyHeading}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t.library.checkBackSoon}</p>
            </div>
          </div>
        ) : (
          <WordsTopicGrid groups={groups} isPremiumUser={premium} canEditCovers={isAdminUser} />
        )}
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1060px] px-4 pt-4 pb-10 md:px-6 md:pt-6">
      <WordsHubHeader active={tab} tabs={tabs} locale={locale} />
      {body}
    </div>
  );
}
