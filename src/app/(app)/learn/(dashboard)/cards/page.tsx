import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";

import { SavedCardsList } from "@/components/app/saved-cards-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchSavedCards } from "@/lib/cards/queries";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";

// A learner's deck must never come from a stale cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Cards" };

/**
 * My Cards (admin feature "Personal word cards"): every word the learner has
 * saved, what's due, a way to practice them, and the Anki export.
 */
export default async function CardsPage() {
  const [user, locale, features] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getEffectiveFeatures(),
  ]);
  const t = locale ? getDictionary(locale) : fallbackDictionary;

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
              <Link href="/login?next=/learn/cards">{t.common.signIn}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!features.personalCards.page) redirect("/learn");

  const cards = await fetchSavedCards(user.id).catch(() => []);
  const now = Date.now();
  const items = cards.map((card) => ({
    word: card.word,
    meaning: card.meaning,
    sentenceEn: card.sentenceEn,
    wordIndex: card.wordIndex,
    lessonTitle: card.lessonTitle,
    nextReviewAt: card.nextReviewAt,
    isDue: card.nextReviewAt !== null && new Date(card.nextReviewAt).getTime() <= now,
  }));
  const dueCount = items.filter((item) => item.isDue).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">{t.myCards.title}</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">{t.myCards.subtitle}</p>

      {items.length === 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">{t.myCards.emptyHeading}</CardTitle>
            <CardDescription>{t.myCards.emptyBody}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {dueCount > 0 ? (
              <Button asChild>
                <Link href="/learn/cards/review">
                  {t.myCards.practiceDue.replace("{n}", String(dueCount))}
                </Link>
              </Button>
            ) : (
              <p className="text-muted-foreground text-sm">{t.myCards.nothingDue}</p>
            )}
            <Button asChild variant="outline">
              <Link href="/learn/cards/review?scope=all">{t.myCards.practiceAll}</Link>
            </Button>
            <Button asChild variant="outline" className="ms-auto">
              <a href="/api/cards/export" download title={t.myCards.exportHint}>
                <Download className="size-4" aria-hidden="true" />
                {t.myCards.exportAnki}
              </a>
            </Button>
          </div>
          <p className="text-muted-foreground mt-6 mb-3 text-sm">
            {t.myCards.cardCount.replace("{n}", String(items.length))}
          </p>
          <SavedCardsList cards={items} />
        </>
      )}
    </div>
  );
}
