"use client";

import { useCallback } from "react";

import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { recordBookSentenceCompletionAction } from "@/lib/book-progress/actions";
import type { BookSentenceCompletionResult } from "@/lib/book-progress/types";

/**
 * Persists book-sentence completions for a signed-in learner; resolves to
 * null for a guest rather than calling the server action at all (which
 * would just throw — see recordBookSentenceCompletionAction's own "Sign in
 * to save progress" guard). Continue Reading has been signed-in-only since
 * it was first built (there's nowhere to persist a guest's position across
 * visits), so a guest reading a book already never expected their place to
 * be saved — BookReadingSession treats a null result as "advance the UI
 * locally, no reward to show," never as an error.
 */
export function useBookProgress() {
  const userId = useAuthUserId();

  const completeSentence = useCallback(
    async (
      bookId: string,
      sectionId: string,
      sentenceId: string,
      sectionAccuracy: number,
    ): Promise<BookSentenceCompletionResult | null> => {
      if (!userId) return null;
      return recordBookSentenceCompletionAction(bookId, sectionId, sentenceId, sectionAccuracy);
    },
    [userId],
  );

  return { isSignedIn: Boolean(userId), completeSentence };
}
