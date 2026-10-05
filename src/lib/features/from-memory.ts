import type { Sentence } from "@/types/content";

/** A sentence that can be asked from memory: it has a meaning in the learner's support language that differs from the English itself. */
export interface FromMemoryItem {
  sentence: Sentence;
  prompt: string;
}

/**
 * The lesson's sentences that From-memory can actually ask. A sentence with
 * no support-language translation (or one that merely falls back to the
 * English) has nothing to prompt with — the same "never show Arabic to a
 * Spanish learner, never show English as its own translation" rule
 * TypingSentence follows. The Arabic `ar` field is used only as the
 * fallback for an Arabic-interface learner, where it is literally correct.
 */
export function buildFromMemoryItems(
  sentences: Sentence[],
  locale: string | null,
): FromMemoryItem[] {
  const items: FromMemoryItem[] = [];
  for (const sentence of sentences) {
    const localized = sentence.supportText?.trim();
    const prompt =
      localized && localized !== sentence.en ? localized : locale === "ar" ? sentence.ar : "";
    if (prompt && prompt.trim() && prompt !== sentence.en) items.push({ sentence, prompt });
  }
  return items;
}
