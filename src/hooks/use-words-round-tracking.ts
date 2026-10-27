"use client";

import { useCallback, useEffect, useRef } from "react";

import { trackWordsRoundAction } from "@/lib/analytics/track-actions";
import { createWordsRoundLedger } from "@/lib/words-round/round";
import type { WordsRoundReport, WordsRoundSource } from "@/lib/words-round/round";
import type { WordOutcome } from "@/lib/word-mastery/schedule";

/** Fire-and-forget: a failed report is not worth a word to the learner, who is already on to the next screen. */
function send(report: WordsRoundReport) {
  void trackWordsRoundAction(report).catch(() => {});
}

/**
 * Reports one round of words to the analytics (WORDS_ROUND_STARTED / WORDS_ROUND_FINISHED): the
 * start when the screen opens with its first word, the end when the round runs to its last word,
 * and in between only the FIRST outcome of each word is kept (`note`), so a word that comes back
 * after a miss does not count twice. Counts only: no word and no id ever leaves the screen. A
 * `null` source (the admin preview, a flow that is not measured) makes every call a no-op.
 *
 * `count` is the number of words the round asks; it is read when the screen opens and the hook
 * does not start a second round on its own: "Practice again" calls `restart`.
 */
export function useWordsRoundTracking(source: WordsRoundSource | null, count: number) {
  const ledgerRef = useRef(createWordsRoundLedger());
  const startedRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!source || startedRef.current || count < 1) return;
    startedRef.current = true;
    send({ event: "started", source, count });
  }, [source, count]);

  /** The first answer to a word of the round; later ones are ignored. */
  const note = useCallback((wordId: string, outcome: WordOutcome) => {
    ledgerRef.current.note(wordId, outcome);
  }, []);

  /** The round ran to its end; once per round. */
  const finish = useCallback(() => {
    if (!source || finishedRef.current) return;
    const tally = ledgerRef.current.tally();
    if (tally.count < 1) return;
    finishedRef.current = true;
    send({ event: "finished", source, ...tally });
  }, [source]);

  /** "Practice again": a new round of `nextCount` words. */
  const restart = useCallback(
    (nextCount: number) => {
      ledgerRef.current.reset();
      finishedRef.current = false;
      if (!source || nextCount < 1) return;
      startedRef.current = true;
      send({ event: "started", source, count: nextCount });
    },
    [source],
  );

  return { note, finish, restart };
}
