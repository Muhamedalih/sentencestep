import { fetchBankStates, isMissingBankSchema } from "@/lib/supabase/queries/learner-words";
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
