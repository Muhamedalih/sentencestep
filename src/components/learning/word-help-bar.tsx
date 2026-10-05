"use client";

import { DictationHelp } from "@/components/learning/dictation-help";
import { useLocale } from "@/components/providers/locale-provider";
import { wordStars } from "@/lib/word-mastery/schedule";
import type { WordAttempt } from "@/lib/word-mastery/schedule";

/**
 * What the upgraded Word Lists practice offers a learner who is stuck on a
 * word: the hint and "I don't know", in the same bar (and the same star price)
 * Dictation uses, so help costs the same thing everywhere.
 *
 * The stars are the stakes of THIS word, and they are the same three steps that
 * decide what happens to its schedule (see wordStars): three for a clean answer
 * (the word climbs a step), two after one hint (it holds), one after a miss or a
 * second hint (it goes back). A hint gives the next right letter, mending
 * anything wrong before it, and always costs a star, one at a time. The hint taken
 * at the last star spends it: the stars are wiped away and hints are closed for
 * this word, so it has to be typed (or given up on, and it comes back later).
 *
 * Quiet and always there: a calm row under the sentence, not a card that pops
 * up — the stars and the two buttons, centred, and nothing that moves when the
 * word settles (the buttons dim instead of leaving).
 */
export function WordHelpBar({
  attempt,
  settled,
  busy,
  onHint,
  onGiveUp,
}: {
  attempt: WordAttempt;
  /** The word has been answered (or given up on): both buttons are done. */
  settled: boolean;
  /** A hint is being drawn right now: the next one has to wait for it to finish. */
  busy: boolean;
  /** Takes a hint; false when there was nothing to give (no star is spent or shown flying). */
  onHint: () => boolean;
  onGiveUp: () => void;
}) {
  const { t, dir } = useLocale();
  const copy = t.wordLists.smart;

  return (
    <DictationHelp
      quiet
      animateIn={false}
      // No visible "need help?" label: the group keeps it as its accessible name.
      showPrompt={false}
      // The repair of the answer starts as the star leaves, and the letter is
      // restored as it lands; pressing a button never takes the typing focus.
      actOnPress
      keepFocus
      stablePrice
      dir={dir}
      prompt={copy.helpPrompt}
      stars={wordStars(attempt)}
      showStakes
      starsLabel={copy.starsLabel}
      lastStarCosts
      noStarsLabel={copy.noStars}
      noStarsTitle={copy.noStarsTitle}
      onShowWord={onHint}
      showWordLabel={copy.hint}
      showWordTitle={copy.hintTitle}
      showingWord={settled || busy}
      costLabel={copy.costLabel}
      costRecorded={copy.costRecorded}
      onGiveUp={onGiveUp}
      giveUpDisabled={settled}
      giveUpLabel={copy.dontKnow}
      giveUpTitle={copy.dontKnowTitle}
    />
  );
}
