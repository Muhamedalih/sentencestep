import { lookupAnyWordClips } from "@/lib/voice/recorded-word-clips";
import { lookupWordListVoiceAudio } from "@/lib/voice/word-list-word-audio";
import { coreSetStates } from "@/lib/word-bank/core-sets";
import type { CoreSet } from "@/lib/word-bank/core-sets";
import { buildBankRoundWord, isAskable } from "@/lib/word-bank/round";
import type { BankRoundWord } from "@/lib/word-bank/round";

/**
 * One set of the core words as a round of the bank's review screen: its eight words, each asked with
 * its meaning and its home sentence (the "meaning" form, as every new word is), and with the word's
 * recorded clip when there is one (the Word Lists voice first, then any voice). Nothing is generated:
 * a failed read of the clips only leaves the sound out. The first answer to each word is what puts
 * it in the learner's bank (see recordBankWordAction).
 */
export async function loadCoreSetRound(set: CoreSet, todayISO: string): Promise<BankRoundWord[]> {
  const states = coreSetStates(set, todayISO);
  const spellings = states.map((state) => state.word);
  const [wordListClips, anyClips] = await Promise.all([
    lookupWordListVoiceAudio(spellings),
    lookupAnyWordClips(spellings),
  ]);
  return states
    .map((state) =>
      buildBankRoundWord(state, {
        otherSentence: null,
        clip: wordListClips.get(state.word) ?? anyClips.get(state.word) ?? null,
      }),
    )
    .filter(isAskable);
}
