"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchSavedWordsAction,
  removeWordCardAction,
  saveWordCardAction,
} from "@/lib/cards/actions";

export interface WordCardsApi {
  /** Whether this (already normalized) word is in the learner's deck. */
  isSaved: (word: string) => boolean;
  /** Saves the word, or removes it if it was already saved. */
  toggle: (card: {
    word: string;
    meaning: string;
    wordIndex: number;
    sentenceId: string;
    sentenceEn: string;
  }) => void;
}

/**
 * The lesson screen's view of the learner's personal word deck (admin
 * feature "Personal word cards"): which words are already saved (to draw a
 * filled star) and a toggle that saves/removes one. Optimistic — the star
 * flips immediately and is put back if the server says no. Returns null when
 * the feature isn't open here, so callers pass it straight down and a null
 * simply means "no star".
 */
export function useSavedCards({
  enabled,
  mode,
  lessonId,
  lessonTitle,
}: {
  enabled: boolean;
  mode: string;
  lessonId: string;
  lessonTitle: string;
}): WordCardsApi | null {
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchSavedWordsAction()
      .then((words) => {
        if (!cancelled) setSaved(new Set(words));
      })
      .catch((error: unknown) => console.error("[cards] load failed", error));
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const isSaved = useCallback((word: string) => saved.has(word), [saved]);

  const toggle = useCallback<WordCardsApi["toggle"]>(
    (card) => {
      const wasSaved = saved.has(card.word);
      const setMembership = (present: boolean) =>
        setSaved((current) => {
          const next = new Set(current);
          if (present) next.add(card.word);
          else next.delete(card.word);
          return next;
        });

      setMembership(!wasSaved);
      const request = wasSaved
        ? removeWordCardAction(card.word)
        : saveWordCardAction({
            word: card.word,
            meaning: card.meaning,
            mode,
            lessonId,
            lessonTitle,
            sentenceId: card.sentenceId,
            sentenceEn: card.sentenceEn,
            wordIndex: card.wordIndex,
          });
      request
        .then((result) => {
          if (!result.ok) setMembership(wasSaved);
        })
        .catch((error: unknown) => {
          console.error("[cards] toggle failed", error);
          setMembership(wasSaved);
        });
    },
    [saved, mode, lessonId, lessonTitle],
  );

  return enabled ? { isSaved, toggle } : null;
}
