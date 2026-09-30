"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import type { ReviewWord } from "@/components/learning/word-review-session";
import {
  deleteSavedCard,
  fetchCardsForReview,
  fetchSavedWordSet,
  insertSavedCard,
  recordCardReview,
} from "@/lib/cards/queries";
import { awardEventBadge } from "@/lib/features/badge-service";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { recordQuestEventsAndBadges } from "@/lib/features/quest-service";
import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { createClient } from "@/lib/supabase/server";
import { buildBlankSentence } from "@/lib/vocabulary-recall/blank-sentence";

/** How many cards one review session covers — a session, not the whole deck. */
const REVIEW_SESSION_LIMIT = 20;

/** The signed-in learner's id, but only when the personal-cards feature is actually open to them; null otherwise (feature off, preview state, premium-only, or a guest). */
async function getCardsUserId(): Promise<string | null> {
  const features = await getEffectiveFeatures();
  if (!features.personalCards.page) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

/** Every saved word, normalized — what the lesson screen needs to draw filled/unfilled stars. [] when the feature isn't open or anything fails. */
export async function fetchSavedWordsAction(): Promise<string[]> {
  try {
    const userId = await getCardsUserId();
    if (!userId) return [];
    return await fetchSavedWordSet(userId);
  } catch (error) {
    console.error("[cards] fetchSavedWordsAction failed", error);
    return [];
  }
}

export interface SaveWordCardInput {
  word: string;
  meaning: string;
  mode: string;
  lessonId: string;
  lessonTitle: string;
  sentenceId: string | null;
  sentenceEn: string;
  wordIndex: number;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

/**
 * Saves the word the learner is looking at to their deck. Everything comes
 * from the client, so it is all validated (lengths, mode, a real word) — the
 * worst a forged request can do is put junk in the caller's OWN deck, which
 * only they ever see (and the Anki export HTML-escapes it).
 */
export async function saveWordCardAction(input: SaveWordCardInput): Promise<{ ok: boolean }> {
  try {
    const features = await getEffectiveFeatures();
    const userId = await getCardsUserId();
    if (!userId) return { ok: false };

    if (input.mode !== "normal" && input.mode !== "stories") return { ok: false };
    if (!features.personalCards.saveSections[input.mode]) return { ok: false };

    const word = normalizeMistakeWord(cleanText(input.word, 60) ?? "");
    const meaning = cleanText(input.meaning, 200);
    const lessonId = cleanText(input.lessonId, 120);
    const lessonTitle = cleanText(input.lessonTitle, 200);
    const sentenceEn = cleanText(input.sentenceEn, 500);
    const sentenceId = input.sentenceId === null ? null : cleanText(input.sentenceId, 120);
    if (!word || !isTrackableWord(word) || !meaning || !lessonId || !lessonTitle || !sentenceEn) {
      return { ok: false };
    }
    if (!Number.isInteger(input.wordIndex) || input.wordIndex < 0 || input.wordIndex > 300) {
      return { ok: false };
    }

    await insertSavedCard(userId, {
      word,
      meaning,
      mode: input.mode,
      lessonId,
      lessonTitle,
      sentenceId,
      sentenceEn,
      wordIndex: input.wordIndex,
    });
    after(async () => {
      await awardEventBadge("firstCard");
    });
    revalidatePath("/learn/cards");
    return { ok: true };
  } catch (error) {
    console.error("[cards] saveWordCardAction failed", error);
    return { ok: false };
  }
}

export async function removeWordCardAction(word: string): Promise<{ ok: boolean }> {
  try {
    const userId = await getCardsUserId();
    if (!userId) return { ok: false };
    await deleteSavedCard(userId, normalizeMistakeWord(word));
    revalidatePath("/learn/cards");
    return { ok: true };
  } catch (error) {
    console.error("[cards] removeWordCardAction failed", error);
    return { ok: false };
  }
}

/** Advances a card's review schedule — the cards counterpart to markVocabularyRecallCompletedAction. */
export async function markCardReviewedAction(word: string, hadErrors: boolean): Promise<void> {
  const userId = await getCardsUserId();
  if (!userId) throw new Error("Sign in to save progress.");
  await recordCardReview(normalizeMistakeWord(word), hadErrors);
  if (!hadErrors) {
    after(async () => {
      await recordQuestEventsAndBadges(userId, [{ type: "masterWords", amount: 1 }]);
    });
  }
  revalidatePath("/learn/cards");
}

/**
 * The review queue, in the same ReviewWord shape WordReviewSession already
 * renders for Word Lists and Vocabulary Recall (sentence with the word
 * blanked out, the meaning as the hint), so the cards review is that same
 * screen — see its `variant="cards"`.
 */
export async function fetchCardReviewWordsAction(scope: "due" | "all"): Promise<ReviewWord[]> {
  try {
    const userId = await getCardsUserId();
    if (!userId) return [];
    const cards = await fetchCardsForReview(userId, scope, REVIEW_SESSION_LIMIT);
    const now = Date.now();
    return cards.map((card) => ({
      id: `card-${card.word}`,
      groupId: "cards",
      order: 0,
      targetWord: card.word,
      sentence: buildBlankSentence(card.sentenceEn, card.wordIndex),
      hintAr: card.meaning,
      supportHint: card.meaning,
      reason: "review" as const,
      lessonTitle: card.lessonTitle,
      daysAgo: Math.max(1, Math.floor((now - new Date(card.createdAt).getTime()) / 86_400_000)),
      // The real synthesized isolated-word pipeline when the sentence still
      // exists; PronunciationButton degrades gracefully when it doesn't.
      ...(card.sentenceId
        ? {
            pronunciationContentType: "sentence_word" as const,
            pronunciationContentId: `${card.sentenceId}::${card.word}`,
          }
        : {}),
    }));
  } catch (error) {
    console.error("[cards] fetchCardReviewWordsAction failed", error);
    return [];
  }
}
