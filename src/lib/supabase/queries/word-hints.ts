import { createClient } from "@/lib/supabase/server";
import { cardHint } from "@/lib/weak-words/hints";

/**
 * The Arabic meaning of a few Word Lists words, for the cards of Home's words section: one small read
 * of at most a handful of rows by id, made only while the Home cards are open for the visitor. Any
 * failure answers "no meanings" and the cards show the word alone, so this can never take Home down.
 */
export async function fetchWordCardHints(
  wordIds: readonly string[],
): Promise<Record<string, string>> {
  const ids = [...new Set(wordIds)].slice(0, 8);
  if (ids.length === 0) return {};
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vocabulary_words")
      .select("id, hint_ar")
      .in("id", ids);
    if (error) throw error;
    const hints: Record<string, string> = {};
    for (const row of data ?? []) {
      const hint = cardHint(row.hint_ar);
      if (hint) hints[row.id] = hint;
    }
    return hints;
  } catch (error) {
    console.error("[word-hints] read failed", error);
    return {};
  }
}
