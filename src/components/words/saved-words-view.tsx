import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

import { SavedCardsList } from "@/components/app/saved-cards-list";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SavedCard } from "@/lib/cards/queries";
import type { Dictionary } from "@/lib/i18n/dictionary";

/**
 * The words a learner saved with the star in a lesson: the place inside «كلماتي» that holds them.
 * What is due, a way to practise them, the Anki export and the list with each word's sentence. A
 * server component: the page reads the learner's own rows and passes them in. `backHref` is set
 * when «كلماتي» has an overview page of its own to go back to (the words bank is open for them).
 */
export function SavedWordsView({
  cards,
  heading,
  dir,
  t,
  backHref,
  backLabel,
  embedded = false,
}: {
  cards: readonly SavedCard[];
  heading: string;
  dir: "ltr" | "rtl";
  t: Dictionary;
  backHref?: string;
  backLabel?: string;
  /** Drawn inside another page (the Saved tab of the Words page): no container, back link or title of its own. */
  embedded?: boolean;
}) {
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
    <div className={embedded ? undefined : "mx-auto max-w-4xl px-6 py-10 sm:py-14"}>
      {!embedded && backHref && backLabel && (
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span dir="auto">{backLabel}</span>
        </Link>
      )}
      {!embedded && (
        <h1 className="text-3xl font-semibold tracking-tight" dir={dir}>
          {heading}
        </h1>
      )}
      <p
        className={
          embedded ? "text-muted-foreground max-w-2xl" : "text-muted-foreground mt-2 max-w-2xl"
        }
        dir={dir}
      >
        {t.myCards.subtitle}
      </p>

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
              <p className="text-muted-foreground text-sm" dir={dir}>
                {t.myCards.nothingDue}
              </p>
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
          <p className="text-muted-foreground mt-6 mb-3 text-sm" dir={dir}>
            {t.myCards.cardCount.replace("{n}", String(items.length))}
          </p>
          <SavedCardsList cards={items} />
        </>
      )}
    </div>
  );
}
