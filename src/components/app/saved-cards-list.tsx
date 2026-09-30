"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { removeWordCardAction } from "@/lib/cards/actions";
import { blankOutWord } from "@/lib/cards/anki";
import { cn } from "@/lib/utils";

export interface CardListItem {
  word: string;
  meaning: string;
  sentenceEn: string;
  wordIndex: number;
  lessonTitle: string;
  /** ISO timestamp the card is next due, or null once mastered. */
  nextReviewAt: string | null;
  isDue: boolean;
}

/** The learner's saved word cards, each with its sentence (word blanked), meaning, due state and a remove button. */
export function SavedCardsList({ cards }: { cards: CardListItem[] }) {
  const { t, dir, locale } = useLocale();
  const [items, setItems] = useState(cards);
  const [, startTransition] = useTransition();
  const dateFormat = new Intl.DateTimeFormat(locale ?? "en", { dateStyle: "medium" });

  function remove(word: string) {
    const previous = items;
    setItems((current) => current.filter((card) => card.word !== word));
    startTransition(async () => {
      const result = await removeWordCardAction(word).catch(() => ({ ok: false }));
      if (!result.ok) setItems(previous);
    });
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((card) => (
        <li
          key={card.word}
          className="border-border/60 bg-card/60 flex flex-col gap-2 rounded-2xl border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold" dir="ltr">
                {card.word}
              </p>
              <p className="text-muted-foreground text-sm" dir={dir}>
                {card.meaning}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {card.nextReviewAt === null ? (
                <Badge variant="success">{t.myCards.masteredTag}</Badge>
              ) : card.isDue ? (
                <Badge variant="default">{t.myCards.dueTag}</Badge>
              ) : null}
              <button
                type="button"
                onClick={() => remove(card.word)}
                aria-label={`${t.myCards.removeCard}: ${card.word}`}
                title={t.myCards.removeCard}
                className="text-muted-foreground hover:text-danger hover:bg-muted rounded-full p-1.5 transition-colors"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm" dir="ltr">
            {blankOutWord(card.sentenceEn, card.wordIndex)}
          </p>
          <p className={cn("text-muted-foreground/80 text-xs")} dir={dir}>
            {card.lessonTitle}
            {card.nextReviewAt && !card.isDue
              ? ` · ${t.myCards.nextReview.replace("{date}", dateFormat.format(new Date(card.nextReviewAt)))}`
              : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
