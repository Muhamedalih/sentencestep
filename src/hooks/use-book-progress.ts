"use client";

import { useCallback } from "react";

import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { recordBookSentenceCompletionAction } from "@/lib/book-progress/actions";
import type { BookSentenceCompletionResult } from "@/lib/book-progress/types";

/**
 * Retries a transient failure of `fn` up to `attempts` times with a short,
 * growing delay between them — added (2026-09-12) after tracing reader
 * reports of a book "forgetting" sentences already read (a refresh replaying
 * content just finished) to complete_book_sentence's compare-and-swap
 * (20250128000000_book_learning_engine.sql): it only ever advances
 * book_progress.current_sentence_id when it still matches the sentence just
 * completed, so a single dropped network call for one sentence's completion
 * — this action used to be fired once, fire-and-forget, with no retry —
 * permanently desyncs the server's pointer from the reader's real position
 * for the rest of that session: every later completion in the same session
 * then silently no-ops (`advanced: false`, by design, never a duplicate
 * count), until a future reload resumes from that stale, now-behind
 * position. Bounded (never retries forever) since this already runs in the
 * background — see completeSentence's own caller in BookReadingSession,
 * which never awaits this before advancing the reading UI.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 400): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

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
      return withRetry(() =>
        recordBookSentenceCompletionAction(bookId, sectionId, sentenceId, sectionAccuracy),
      );
    },
    [userId],
  );

  return { isSignedIn: Boolean(userId), completeSentence };
}
