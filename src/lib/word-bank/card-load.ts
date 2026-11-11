import { fetchBankStates, isMissingBankSchema } from "@/lib/supabase/queries/learner-words";
import { CORE_SETS, coreProgress } from "@/lib/word-bank/core-sets";
import type { CoreProgress } from "@/lib/word-bank/core-sets";
import { bankCardData, bankOverview } from "@/lib/word-bank/shelves";
import type { BankCardData } from "@/lib/word-bank/shelves";

/**
 * Today's words of a learner's words bank for the Home «كلماتك» card (and the same card on the Word
 * Lists page): one read of the learner's own rows, made only for a learner the "wordBank" permission
 * is open to. Null on a day with no words for them, and on any failure (a project without the table
 * included): the card then shows what it always showed, never an error.
 */
export async function loadBankCard(userId: string, todayISO: string): Promise<BankCardData | null> {
  try {
    return bankCardData(bankOverview(await fetchBankStates(userId), todayISO));
  } catch (error) {
    if (!isMissingBankSchema(error)) console.error("[word-bank] reading the card failed", error);
    return null;
  }
}

/** What Word Lists shows of the bank: today's card, and the core-words shelf with the learner's place on it. */
export interface BankWordLists {
  card: BankCardData | null;
  shelf: {
    sets: (CoreProgress["sets"][number] & { preview: string })[];
    inBank: number;
    total: number;
    currentN: number | null;
  };
}

/**
 * Both from ONE read of the learner's own rows (made only for a learner the "wordBank" permission is
 * open to). On a failure (a project without the table included) the card is null and the shelf shows
 * every set as not started, never an error.
 */
export async function loadBankWordLists(userId: string, todayISO: string): Promise<BankWordLists> {
  let states: Awaited<ReturnType<typeof fetchBankStates>> = [];
  try {
    states = await fetchBankStates(userId);
  } catch (error) {
    if (!isMissingBankSchema(error)) console.error("[word-bank] reading the bank failed", error);
  }
  const progress = coreProgress(states);
  return {
    card: bankCardData(bankOverview(states, todayISO)),
    shelf: {
      sets: progress.sets.map((set) => ({
        ...set,
        preview: CORE_SETS[set.n - 1]!.words.slice(0, 4)
          .map((word) => word.word)
          .join(" · "),
      })),
      inBank: progress.inBank,
      total: progress.total,
      currentN: progress.currentN,
    },
  };
}
