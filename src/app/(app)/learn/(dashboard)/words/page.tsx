import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MyWordsList, MyWordsOverview, isBankListView } from "@/components/words/my-words-page";
import { SavedWordsView } from "@/components/words/saved-words-view";
import { fetchSavedCards } from "@/lib/cards/queries";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { dirFor } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchBankStates, isMissingBankSchema } from "@/lib/supabase/queries/learner-words";
import { bankOverview, shelveBank } from "@/lib/word-bank/shelves";
import { bankStrings } from "@/lib/word-bank/strings";
import { getLearnerToday } from "@/lib/word-mastery/access";

// The page is the learner's own words on the day it is opened: never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Words" };

/**
 * The words bank's own section («كلماتي»): today's words (five at most), where the learner's words
 * stand, and with `?show=` the list of every word under its lesson's name. Behind the "wordBank"
 * permission (Admins only until the owner opens it) and for a signed-in learner only: anyone else
 * goes back to Home. One read (the learner's own rows); a project without the table, or a failed
 * read, shows an empty bank instead of an error.
 *
 * It is also where the words saved with the star live ("Personal word cards"): a tile at the foot
 * of the overview opens them, and a learner who has the saved words but not the bank sees them here
 * directly (the section is then just that place).
 */
export default async function MyWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string | string[] }>;
}) {
  const [features, user, locale] = await Promise.all([
    getEffectiveFeatures(),
    getCurrentUser(),
    getLocale(),
  ]);
  const savedOpen = features.personalCards.page;
  if (!user || (!features.rollouts.wordBank && !savedOpen)) redirect("/learn");
  // With the one Words page («الكلمات», permission wordsPage) the overview is that page; the lists of
  // words (?show=) keep their own address.
  if (features.rollouts.wordsPage && !isBankListView((await searchParams).show)) {
    redirect("/learn/word-lists");
  }

  if (!features.rollouts.wordBank) {
    // The saved words only: no bank to show, so the section is the saved list itself.
    const cards = await fetchSavedCards(user.id).catch(() => []);
    return (
      <SavedWordsView
        cards={cards}
        heading={(locale ? getDictionary(locale) : fallbackDictionary).myWords.title}
        dir={locale ? dirFor(locale) : "ltr"}
        t={locale ? getDictionary(locale) : fallbackDictionary}
      />
    );
  }

  const [todayISO, states, params, savedCards] = await Promise.all([
    getLearnerToday(),
    fetchBankStates(user.id).catch((error: unknown) => {
      if (!isMissingBankSchema(error)) console.error("[word-bank] reading the bank failed", error);
      return [];
    }),
    searchParams,
    savedOpen ? fetchSavedCards(user.id).catch(() => []) : Promise.resolve(null),
  ]);
  const t = locale ? getDictionary(locale) : fallbackDictionary;
  const s = bankStrings(locale);

  if (isBankListView(params.show)) {
    return (
      <MyWordsList
        shelves={shelveBank(states)}
        view={params.show}
        todayISO={todayISO}
        t={t}
        s={s}
      />
    );
  }
  return (
    <MyWordsOverview
      overview={bankOverview(states, todayISO)}
      todayISO={todayISO}
      locale={locale}
      t={t}
      s={s}
      saved={
        savedCards
          ? { count: savedCards.length, latest: savedCards.slice(0, 4).map((card) => card.word) }
          : null
      }
    />
  );
}
