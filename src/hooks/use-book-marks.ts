"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { setBookmarkAction, setNoteAction } from "@/lib/book-progress/marks-actions";
import type { BookSentenceMark } from "@/lib/book-progress/marks";

/**
 * One sentence's Save/Note state for the current reader, updating
 * optimistically on toggle/save so the UI never waits on a round trip to
 * feel responsive. Deliberately a controlled hook, not a self-fetching one:
 * `mark` always comes from the caller (BookMarkControls → BookSentenceReader
 * → BookReadingSession's `marksBySentence`), which fetches every sentence on
 * the current reading page/section in ONE batched request — see
 * fetchBookSentenceMarksAction's doc comment. A hook that fetched its own
 * single-sentence state here (as this used to) would refire once per
 * mounted BookSentenceReader instance, and a reading page can mount several
 * at once — a real N+1 this design avoids structurally rather than by
 * convention.
 */
export function useBookSentenceMark(bookId: string, sentenceId: string, mark: BookSentenceMark) {
  const userId = useAuthUserId();
  const isSignedIn = Boolean(userId);
  const [isBookmarked, setIsBookmarked] = useState(mark.isBookmarked);
  const [note, setNote] = useState<string | null>(mark.note);

  useEffect(() => {
    setIsBookmarked(isSignedIn ? mark.isBookmarked : false);
    setNote(isSignedIn ? mark.note : null);
  }, [isSignedIn, mark]);

  const toggleBookmark = useCallback(() => {
    if (!isSignedIn) return;
    // The state update and the server action are two separate statements,
    // not one nested inside the other: a setState updater must be pure, and
    // calling a "use server" action from inside one (as this used to) let
    // Next's router-level action tracking fire while React was still
    // processing this update, surfacing as "Cannot update a component
    // (Router) while rendering a different component (BookMarkControls)".
    // saveNote below already follows this same two-statement shape.
    const previous = isBookmarked;
    const next = !isBookmarked;
    setIsBookmarked(next);
    // A failed write reverts the optimistic toggle rather than leaving the
    // UI claiming a save that never landed — same "log, don't leave a lie
    // on screen" idiom as completeSentence's own catch in
    // BookReadingSession (no toast system exists yet to surface this more
    // visibly, and a Save toggle silently snapping back is unobtrusive
    // enough not to need one).
    setBookmarkAction(bookId, sentenceId, next).catch((error) => {
      console.error("Failed to save bookmark", error);
      setIsBookmarked(previous);
    });
  }, [isSignedIn, bookId, sentenceId, isBookmarked]);

  const saveNote = useCallback(
    (text: string | null) => {
      if (!isSignedIn) return;
      const previousNote = note;
      const previousIsBookmarked = isBookmarked;
      const normalized = text?.trim() ? text.trim() : null;
      setNote(normalized);
      // Writing a real note implicitly saves the sentence too (see
      // upsertNote's doc comment) — reflected here optimistically so the
      // Save toggle updates in lockstep with the note popover closing,
      // never lagging a round trip behind.
      if (normalized) setIsBookmarked(true);
      setNoteAction(bookId, sentenceId, normalized).catch((error) => {
        console.error("Failed to save note", error);
        setNote(previousNote);
        setIsBookmarked(previousIsBookmarked);
      });
    },
    [isSignedIn, bookId, sentenceId, note, isBookmarked],
  );

  return { isSignedIn, isBookmarked, note, toggleBookmark, saveNote };
}
