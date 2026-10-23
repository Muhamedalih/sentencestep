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
  /**
   * The stored clip in the sentence's own lesson's voice — always there: a sentence with no stored
   * clip is not asked at all, so the exam never falls back to the browser's voice and never makes one.
   * The sound-based forms play it before the answer; the meaning-only form offers it only after.
   */
  audioUrl: string;
  /** The pieces (indexes into sentenceTokens) the partial form hides; empty for the other forms. */
  masked: number[];
}

/**
 * The first `limit` sentences of the selection that can be asked, in the selection's own order. The
 * exam always has its sound, in the voice of the lesson the sentence is from, so a sentence with no
 * stored clip is left out (it is never read by the browser's voice and never generated here); so is
 * one with no meaning in the learner's language when its form needs the meaning. The selection
 * carries a few spare for the ones that drop out.
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
    const audioUrl = args.clips.get(sentence.id);
    if (!audioUrl) continue;
    // A sentence of today's lesson is asked the way a middling one is, never the easy first form.
    const form = reviewFormFor(reason === "today" ? TODAY_FORM_STRENGTH : strength, {
      audio: true,
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
