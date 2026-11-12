"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchSavedWordsAction,
  removeWordCardAction,
  saveWordCardAction,
} from "@/lib/cards/actions";

export interface WordCardsApi {
  /** Whether this (already normalized) word is in the learner's saved words. */
  isSaved: (word: string) => boolean;
  /** Saves the word, or removes it if it was already saved. */
  toggle: (card: {
    word: string;
    meaning: string;
    wordIndex: number;
    sentenceId: string;
    sentenceEn: string;
  }) => void;
  /** True right after the learner's very first save, until the note is closed: the screen says where the word went. */
  notice: boolean;
  dismissNotice: () => void;
}

/** Set once the "saved to My Words" note has been shown, so a learner who empties the list and saves again is not told twice. */
const NOTICE_SEEN_KEY = "ss:saved-words-notice";

function noticeAlreadySeen(): boolean {
  try {
    return window.localStorage.getItem(NOTICE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberNoticeSeen(): void {
  try {
    window.localStorage.setItem(NOTICE_SEEN_KEY, "1");
  } catch {
    // Private mode or blocked storage: the server's "first save" answer already limits the note to once.
  }
}

/**
 * The lesson screen's view of the learner's saved words (feature "Personal word cards": the star
 * saves into «كلماتي» → Saved words): which words are already saved (to draw a filled star) and a
 * toggle that saves/removes one. Optimistic — the star flips immediately and is put back if the
 * server says no. The server also says when this was the learner's very first saved word, and then
 * `notice` turns true once so the screen can say where the word went. Returns null when the feature
 * isn't open here, so callers pass it straight down and a null simply means "no star".
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
  const [notice, setNotice] = useState(false);

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
  const dismissNotice = useCallback(() => setNotice(false), []);

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
          if (!result.ok) {
            setMembership(wasSaved);
            return;
          }
          if ("first" in result && result.first && !noticeAlreadySeen()) {
            rememberNoticeSeen();
            setNotice(true);
          }
        })
        .catch((error: unknown) => {
          console.error("[cards] toggle failed", error);
          setMembership(wasSaved);
        });
    },
    [saved, mode, lessonId, lessonTitle],
  );

  return enabled ? { isSaved, toggle, notice, dismissNotice } : null;
}
