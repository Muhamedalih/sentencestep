import { maskedTokenIndexes } from "@/lib/sentence-bank/mask";
import { TODAY_FORM_STRENGTH, reviewFormFor } from "@/lib/sentence-bank/review";
import type { ReviewForm } from "@/lib/sentence-bank/review";
import type { ReviewItem, ReviewReason, SentenceCandidate } from "@/lib/sentence-bank/select";

/**
 * Sentence bank: a chosen sentence turned into what the review screen draws. Pure — the loader
 * looked up each sentence's meaning in the learner's language and its stored clip; this decides
 * the form and, for the partial form, which words are hidden.
 */
export interface ReviewScreenItem {
  id: string;
  lessonId: string;
  en: string;
  /** The sentence's meaning in the learner's language, when it has one. */
  prompt: string | null;
  /** 0 for a sentence never asked back. */
  strength: number;
  reason: ReviewReason;
  form: ReviewForm;
  /** The stored clip (never a freshly generated one), or null. The sound-based forms play it before the answer; the meaning-only form offers it only after. */
  audioUrl: string | null;
  /** The pieces (indexes into sentenceTokens) the partial form hides; empty for the other forms. */
  masked: number[];
}

/**
 * The first `limit` sentences of the selection that can be asked, in the selection's own order. A
 * sentence with neither a stored clip nor a meaning in the learner's language cannot be asked in
 * any hidden-text form and is left for another day (the selection carries a few spare for that).
 */
export function buildReviewItems(args: {
  selection: readonly ReviewItem<SentenceCandidate>[];
  /** Sentence id → its meaning in the learner's language. */
  prompts: ReadonlyMap<string, string>;
  /** Sentence id → its stored clip's URL. */
  clips: ReadonlyMap<string, string>;
  weakWords: ReadonlySet<string>;
  limit: number;
}): ReviewScreenItem[] {
  const items: ReviewScreenItem[] = [];
  for (const { sentence, strength, reason } of args.selection) {
    if (items.length >= args.limit) break;
    const prompt = args.prompts.get(sentence.id)?.trim() || null;
    const meaning = prompt && prompt !== sentence.en ? prompt : null;
    const audioUrl = args.clips.get(sentence.id) ?? null;
    // A sentence of today's lesson is asked the way a middling one is, never the easy first form.
    const form = reviewFormFor(reason === "today" ? TODAY_FORM_STRENGTH : strength, {
      audio: audioUrl !== null,
      prompt: meaning !== null,
    });
    if (!form) continue;
    items.push({
      id: sentence.id,
      lessonId: sentence.lessonId,
      en: sentence.en,
      prompt: meaning,
      strength,
      reason,
      form,
      audioUrl,
      masked:
        form === "partial"
          ? maskedTokenIndexes(sentence.en, {
              strength,
              weakWords: args.weakWords,
              seed: `${sentence.id}:${strength}`,
            })
          : [],
    });
  }
  return items;
}
