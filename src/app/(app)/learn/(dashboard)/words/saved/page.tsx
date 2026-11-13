import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SavedWordsView } from "@/components/words/saved-words-view";
import { WordsHubHeader } from "@/components/words/words-hub-header";
import { availableTabs } from "@/lib/words-hub/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSavedCards } from "@/lib/cards/queries";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { dirFor } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/supabase/auth";

// A learner's saved words must never come from a stale cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Saved words" };

/**
 * Saved words, the place inside «كلماتي» for the words a learner saves with the star in a lesson
 * (feature "Personal word cards"): what is due, practice, the Anki export and the list. A visitor the
 * account features are switched on for gets the sign-in prompt; anyone else goes back to Home.
 */
export default async function SavedWordsPage() {
  const [user, locale, features] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getEffectiveFeatures(),
  ]);
  const t = locale ? getDictionary(locale) : fallbackDictionary;
  const dir = locale ? dirFor(locale) : "ltr";

  if (!user) {
    // Only a visitor the account features are switched on for gets the
    // sign-in prompt; with them off there is no such page to offer.
    if (!features.guestTeaser) redirect("/learn");
    return (
      <div className="mx-auto max-w-lg px-6 py-16 sm:py-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t.myCards.signInHeading}</CardTitle>
            <CardDescription>{t.myCards.signInBody}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login?next=/learn/words/saved">{t.common.signIn}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!features.personalCards.page) redirect("/learn");

  const cards = await fetchSavedCards(user.id).catch(() => []);
  if (features.rollouts.wordsPage) {
    // The one Words page: the saved words are its third tab, under the same title and tabs.
    return (
      <div className="mx-auto w-full max-w-[1060px] px-4 pt-4 pb-10 md:px-6 md:pt-6">
        <WordsHubHeader
          active="saved"
          tabs={availableTabs({
            core: features.rollouts.wordBank,
            map: features.rollouts.wordsMap,
            saved: true,
          })}
          locale={locale}
        />
        <SavedWordsView cards={cards} heading={t.myCards.title} dir={dir} t={t} embedded />
      </div>
    );
  }
  return (
    <SavedWordsView
      cards={cards}
      heading={t.myCards.title}
      dir={dir}
      t={t}
      // The overview page of «كلماتي» exists only while the words bank is open for this learner.
      backHref={features.rollouts.wordBank ? "/learn/words" : undefined}
      backLabel={features.rollouts.wordBank ? t.myWords.title : undefined}
    />
  );
}
