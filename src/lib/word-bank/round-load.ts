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
import { bankDay } from "@/lib/word-bank/shelves";
import { loadCatalogSentences } from "@/lib/word-bank/sentence-index";

/** What the review page hands its screen. */
export interface BankRoundPayload {
  words: BankRoundWord[];
  /** Always false: a day asks five words and no more (see bankDay), so the finish screen never offers another round. */
  more: boolean;
  /** Every word in the learner's bank, for the finish screen's "your words now". */
  bankTotal: number;
}

/**
 * One review round of the learner's words bank: the due words among those being learned, never more
 * than the day has left of its five (see bankDay: waiting and stable words are never asked), each as
 * the question its strength asks (see buildBankRoundWord). Everything is read from what is already
 * stored — nothing is synthesized or generated here: the recorded clip of each word (the story's own
 * voice first for a story's word, the Word Lists voice first for the rest), and another sentence of
 * the catalog for the words that are asked in a new context. A failure to read the clips or the
 * catalog only costs the forms that need them (a word steps down a form), never the round.
 */
export async function loadBankRound(args: {
  userId: string;
  todayISO: string;
}): Promise<BankRoundPayload> {
  const states = await fetchBankStates(args.userId);
  const day = bankDay(states, args.todayISO);
  // A pool bigger than a round, so a word that cannot be asked never shortens it.
  const pool = day.left > 0 ? day.due.slice(0, BANK_CANDIDATE_POOL) : [];
  if (pool.length === 0) return { words: [], more: false, bankTotal: states.length };

  const spellings = pool.map((state) => state.word);
  const needsSentences = pool.some((state) => state.strength >= 2);
  const [wordListClips, anyClips, sentences] = await Promise.all([
    lookupWordListVoiceAudio(spellings),
    lookupAnyWordClips(spellings),
    needsSentences ? loadCatalogSentences() : Promise.resolve([] as string[]),
  ]);

  const askable = pool
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

  return { words: askable.slice(0, day.left), more: false, bankTotal: states.length };
}
