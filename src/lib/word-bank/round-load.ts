import { fetchBankStates } from "@/lib/supabase/queries/learner-words";
import { lookupAnyWordClips } from "@/lib/voice/recorded-word-clips";
import { lookupWordListVoiceAudio } from "@/lib/voice/word-list-word-audio";
import {
  BANK_CANDIDATE_POOL,
  buildBankRoundWord,
  isAskable,
  pickOtherSentence,
} from "@/lib/word-bank/round";
import type { BankRoundWord } from "@/lib/word-bank/round";
import { BANK_ROUND_SIZE, selectBankRound } from "@/lib/word-bank/select";
import { loadCatalogSentences } from "@/lib/word-bank/sentence-index";

/** What the review page hands its screen. */
export interface BankRoundPayload {
  words: BankRoundWord[];
  /** More words would be due after these: a yes or a no (the finish screen's "5 more"), never a number. */
  more: boolean;
  /** Every word in the learner's bank, for the finish screen's "your words now". */
  bankTotal: number;
}

/**
 * One review round of the learner's words bank: up to five words that are due, each as the question
 * its strength asks (see buildBankRoundWord). Everything is read from what is already stored —
 * nothing is synthesized or generated here: the recorded clip of each word (the story's own voice
 * first for a story's word, the Word Lists voice first for the rest), and another sentence of the
 * catalog for the words that are asked in a new context. A failure to read the clips or the
 * catalog only costs the forms that need them (a word steps down a form), never the round.
 */
export async function loadBankRound(args: {
  userId: string;
  todayISO: string;
  size?: number;
}): Promise<BankRoundPayload> {
  const size = args.size ?? BANK_ROUND_SIZE;
  const states = await fetchBankStates(args.userId);
  // A pool far bigger than a round, so a word that cannot be asked never shortens it.
  const pool = selectBankRound(states, args.todayISO, BANK_CANDIDATE_POOL);
  if (pool.words.length === 0) return { words: [], more: false, bankTotal: states.length };

  const spellings = pool.words.map((state) => state.word);
  const needsSentences = pool.words.some((state) => state.strength >= 2);
  const [wordListClips, anyClips, sentences] = await Promise.all([
    lookupWordListVoiceAudio(spellings),
    lookupAnyWordClips(spellings),
    needsSentences ? loadCatalogSentences() : Promise.resolve([] as string[]),
  ]);

  const askable = pool.words
    .map((state) => {
      const clip =
        (state.source === "story"
          ? (anyClips.get(state.word) ?? wordListClips.get(state.word))
          : (wordListClips.get(state.word) ?? anyClips.get(state.word))) ?? null;
      const otherSentence =
        state.strength >= 2
          ? pickOtherSentence(state.word, sentences, {
              exclude: state.homeSentence ? [state.homeSentence] : [],
              seed: `${state.word}:${args.todayISO}`,
            })
          : null;
      return buildBankRoundWord(state, { otherSentence, clip });
    })
    .filter(isAskable);

  return {
    words: askable.slice(0, size),
    more: askable.length > size || pool.more,
    bankTotal: states.length,
  };
}
