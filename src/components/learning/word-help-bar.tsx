"use client";

import { DictationHelp } from "@/components/learning/dictation-help";
import { useLocale } from "@/components/providers/locale-provider";
import { wordStars } from "@/lib/word-mastery/schedule";
import type { WordAttempt } from "@/lib/word-mastery/schedule";

/**
 * What the upgraded Word Lists practice offers a learner who is stuck on a
 * word: the first-letter hint and "I don't know", in the same bar (and the same
 * star price) Dictation uses, so help costs the same thing everywhere.
 *
 * The stars are the stakes of THIS word, and they are the same three steps that
 * decide what happens to its schedule (see wordStars): three for a clean answer
 * (the word climbs a step), two once the hint has been taken (it holds), one
 * after a miss (it goes back). On a word that has already been missed this visit
 * nothing is at stake any more — the miss is on record — so the bar drops the
 * stars and the price and simply offers its help for free.
 *
 * Quiet and always there: a calm row under the sentence, not a card that pops up.
 */
export function WordHelpBar({
  attempt,
  settled,
  onHint,
  onGiveUp,
}: {
  attempt: WordAttempt;
  /** The word has been answered (or given up on): both buttons are done. */
  settled: boolean;
  onHint: () => void;
  onGiveUp: () => void;
}) {
  const { t, dir } = useLocale();
  const copy = t.wordLists.smart;

  return (
    <DictationHelp
      quiet
      animateIn={false}
      dir={dir}
      prompt={copy.helpPrompt}
      stars={wordStars(attempt)}
      showStakes={!attempt.missed}
      starsLabel={copy.starsLabel}
      onShowWord={onHint}
      showWordLabel={copy.hint}
      showWordTitle={copy.hintTitle}
      // The hint is once per word, and pointless once the word is done.
      showingWord={attempt.hinted || settled}
      costLabel={copy.costLabel}
      costRecorded={copy.costRecorded}
      onGiveUp={settled ? undefined : onGiveUp}
      giveUpLabel={copy.dontKnow}
      giveUpTitle={copy.dontKnowTitle}
    />
  );
}
