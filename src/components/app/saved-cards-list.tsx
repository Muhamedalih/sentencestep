"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { removeWordCardAction } from "@/lib/cards/actions";
import { blankOutWord } from "@/lib/cards/anki";
import { cn } from "@/lib/utils";

const UNDO_MS = 5000;

interface PendingRemoval {
  card: CardListItem;
  index: number;
  timer: number;
}

function insertAt(list: CardListItem[], card: CardListItem, index: number): CardListItem[] {
  const next = [...list];
  next.splice(Math.min(index, next.length), 0, card);
  return next;
}

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
  // A removal waits UNDO_MS before it is sent, so a mis-tap can be taken back.
  const [pending, setPending] = useState<PendingRemoval | null>(null);
  const pendingRef = useRef<PendingRemoval | null>(null);
  const dateFormat = new Intl.DateTimeFormat(locale ?? "en", { dateStyle: "medium" });

  function commit(entry: PendingRemoval) {
    void removeWordCardAction(entry.card.word)
      .catch(() => ({ ok: false }))
      .then((result) => {
        if (!result.ok) setItems((current) => insertAt(current, entry.card, entry.index));
      });
  }

  function flushPending() {
    const entry = pendingRef.current;
    if (!entry) return;
    window.clearTimeout(entry.timer);
    pendingRef.current = null;
    setPending(null);
    commit(entry);
  }

  function remove(word: string) {
    flushPending(); // a second removal finishes the first
    const index = items.findIndex((card) => card.word === word);
    const card = items[index];
    if (!card) return;
    setItems((current) => current.filter((item) => item.word !== word));
    const entry = { card, index, timer: window.setTimeout(flushPending, UNDO_MS) };
    pendingRef.current = entry;
    setPending(entry);
  }

  function undo() {
    const entry = pendingRef.current;
    if (!entry) return;
    window.clearTimeout(entry.timer);
    pendingRef.current = null;
    setPending(null);
    setItems((current) => insertAt(current, entry.card, entry.index));
  }

  // Leaving the page finishes a removal that is still waiting.
  useEffect(
    () => () => {
      const entry = pendingRef.current;
      if (!entry) return;
      window.clearTimeout(entry.timer);
      commit(entry);
    },
    // Unmount only.
    [],
  );

  return (
    <>
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
                  className="text-muted-foreground hover:text-danger hover:bg-muted rounded-full p-1.5 transition-colors pointer-coarse:-m-2 pointer-coarse:p-3.5"
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
      {pending && (
        <div
          role="status"
          className="border-border bg-card fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl border py-1 ps-4 pe-1 shadow-lg md:bottom-6"
        >
          <span className="text-sm" dir={dir}>
            {t.myCards.cardRemoved}
          </span>
          <button
            type="button"
            onClick={undo}
            className="text-primary h-11 rounded-lg px-4 text-sm font-semibold"
          >
            {t.myCards.undoRemove}
          </button>
        </div>
      )}
    </>
  );
}
