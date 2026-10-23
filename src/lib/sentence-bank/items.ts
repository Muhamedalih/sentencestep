import { TODAY_FORM_STRENGTH, reviewFormFor } from "@/lib/sentence-bank/review";
import type { ReviewForm } from "@/lib/sentence-bank/review";
import type { ReviewReason } from "@/lib/sentence-bank/select";
import type { TodayLine } from "@/lib/sentence-bank/today-exam";

/**
 * Sentence bank: a chosen sentence turned into what the review screen draws. Pure — the loader
 * looked up each sentence's meaning in the learner's language and its stored clip; this decides
 * the form it is asked in.
 */
export type ReviewSource = "sentence" | "passage";

export interface ReviewScreenItem {
  id: string;
  /** The story or the passage the sentence belongs to. */
  lessonId: string;
  /** A sentence of a lesson (a row of the sentences table: it reaches the schedule) or a line of a passage (it only counts for the day's task). */
  source: ReviewSource;
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
 * The lines of today's lessons that can be asked, in the order they came in. Every one is typed
 * whole — heard first and written out from memory, the way a sentence of a lesson finished today is
 * asked (TODAY_FORM_STRENGTH) — never the fill-in-a-word form. The exam always has its sound: a
 * story's sentence in the voice of its own lesson, a passage line in its narrated clip, so a line
 * with no stored clip is left out (it is never read by the browser's voice and never generated here).
 */
export function buildTodayItems(args: {
  lines: readonly TodayLine[];
  /** Line id → its meaning in the learner's language. */
  prompts: ReadonlyMap<string, string>;
  /** Line id → its stored clip's URL. */
  clips: ReadonlyMap<string, string>;
}): ReviewScreenItem[] {
  const items: ReviewScreenItem[] = [];
  for (const line of args.lines) {
    const audioUrl = args.clips.get(line.id);
    if (!audioUrl) continue;
    const prompt = args.prompts.get(line.id)?.trim() || null;
    const meaning = prompt && prompt !== line.en ? prompt : null;
    const form = reviewFormFor(TODAY_FORM_STRENGTH, { audio: true, prompt: meaning !== null });
    if (!form) continue;
    items.push({
      id: line.id,
      lessonId: line.lessonId,
      source: line.source === "passage" ? "passage" : "sentence",
      en: line.en,
      prompt: meaning,
      strength: 0,
      reason: "today",
      form,
      audioUrl,
      masked: [],
    });
  }
  return items;
}
