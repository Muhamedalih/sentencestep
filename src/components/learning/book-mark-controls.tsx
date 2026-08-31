"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, NotebookPen } from "lucide-react";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useBookSentenceMark } from "@/hooks/use-book-marks";
import { cn } from "@/lib/utils";
import type { BookSentenceMark } from "@/lib/book-progress/marks";

/**
 * Bookmark + note controls for one Book Reading sentence (Book Reading
 * Experience Enhancements Phase 2) — private per-reader annotations,
 * entirely separate from book_progress/XP/streaks (see useBookSentenceMark).
 * Always renders, signed in or not: hiding the whole control when signed out
 * (the previous behavior) meant any timing gap in auth resolution made
 * Bookmark/Note disappear from the reading UI entirely, which is worse than
 * a guest occasionally tapping a control that asks them to sign in. Only the
 * *write* is gated on `isSignedIn` (still true — RLS backs that up too); a
 * signed-out tap opens a small "sign in to save" popover in the exact spot
 * the note editor uses instead of touching the database.
 */
export function BookMarkControls({
  bookId,
  sentenceId,
  inputRef,
  mark,
}: {
  bookId: string;
  sentenceId: string;
  /**
   * The active sentence's typing input (Reading Experience Polish, Goal 2).
   * Clicking any real `<button>` here would otherwise move DOM focus to it,
   * forcing the learner to click the sentence again to keep typing — same
   * problem PronunciationButton/PronunciationSpeedControl already solve for
   * replay/speed. Restored after Bookmark toggles and after Note Save/
   * Delete (both of which close the note editor), but deliberately NOT
   * after opening the note editor — the textarea's own `autoFocus` is what
   * should receive focus there, and this must never fight it or steal focus
   * back while the learner is actively typing inside it.
   */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** This sentence's Save/Note state, already fetched in one batched request for the whole reading page — see useBookSentenceMark's own doc comment for why this avoids an N+1. */
  mark: BookSentenceMark;
}) {
  const { t, dir } = useLocale();
  const { isSignedIn, isBookmarked, note, toggleBookmark, saveNote } = useBookSentenceMark(
    bookId,
    sentenceId,
    mark,
  );
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [draft, setDraft] = useState(note ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Either popup (the note editor or the sign-in prompt — never both at
  // once) shares this same viewport-collision handling: both are the same
  // fixed-width w-64 card anchored `end-0` off this control's trigger, and
  // that trigger can sit anywhere along a sentence's width — including near
  // the left edge of the viewport, where an `end-0` (right-edge-anchored,
  // extending leftward) popup runs off-screen. `open` covers both cases so
  // the same measurement effect handles either.
  const open = isEditingNote || showSignInPrompt;
  const popupRef = useRef<HTMLDivElement>(null);
  const [flipAbove, setFlipAbove] = useState(false);
  const [popupShift, setPopupShift] = useState({ x: 0, y: 0 });

  // Keeps the popup fully inside the viewport regardless of where its
  // trigger sits, without hardcoding a side or an offset. It measures the
  // trigger's real position and the popup's real (untransformed) size on
  // every open and on resize, decides whether "below" still has room (else
  // flips to open above), then nudges the popup by exactly the pixels
  // needed to clear each edge — recomputed fresh each time, so it's correct
  // at any viewport width or trigger position, not a fixed offset tuned for
  // one layout. Reads `popupEl.offsetLeft/offsetTop/offsetWidth/offsetHeight`
  // (the CSS layout box) rather than `getBoundingClientRect()` on the popup
  // itself, because the popup is a framer-motion element whose entrance
  // animation applies its own `transform` (scale/translate) — a rect read
  // mid-animation would be wrong, while offset* values are unaffected by
  // transform and available immediately.
  useLayoutEffect(() => {
    if (!open) {
      setFlipAbove(false);
      setPopupShift({ x: 0, y: 0 });
      return;
    }
    const containerEl = containerRef.current;
    const popupEl = popupRef.current;
    if (!containerEl || !popupEl) return;

    const EDGE_GAP = 12;
    const TRIGGER_GAP = 6; // matches the popup's own mt-1.5 / mb-1.5

    function measure() {
      if (!containerEl || !popupEl) return;
      const containerRect = containerEl.getBoundingClientRect();
      const width = popupEl.offsetWidth;
      const height = popupEl.offsetHeight;

      const spaceBelow = window.innerHeight - EDGE_GAP - (containerRect.bottom + TRIGGER_GAP);
      const spaceAbove = containerRect.top - TRIGGER_GAP - EDGE_GAP;
      const nextFlip = height > spaceBelow && spaceAbove > spaceBelow;
      setFlipAbove(nextFlip);

      const naturalLeft = containerRect.left + popupEl.offsetLeft;
      let shiftX = 0;
      if (naturalLeft < EDGE_GAP) shiftX = EDGE_GAP - naturalLeft;
      else if (naturalLeft + width > window.innerWidth - EDGE_GAP) {
        shiftX = window.innerWidth - EDGE_GAP - (naturalLeft + width);
      }

      const naturalTop = nextFlip
        ? containerRect.top - TRIGGER_GAP - height
        : containerRect.bottom + TRIGGER_GAP;
      let shiftY = 0;
      if (naturalTop < EDGE_GAP) shiftY = EDGE_GAP - naturalTop;
      else if (naturalTop + height > window.innerHeight - EDGE_GAP) {
        shiftY = window.innerHeight - EDGE_GAP - (naturalTop + height);
      }

      setPopupShift({ x: shiftX, y: shiftY });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  // The draft only ever needs to resync from the loaded/saved note when the
  // editor isn't open (opening it starts a fresh edit from whatever's
  // currently saved) — see the effect below.
  useEffect(() => {
    if (!isEditingNote) setDraft(note ?? "");
  }, [note, isEditingNote]);

  useEffect(() => {
    if (!isEditingNote && !showSignInPrompt) return;
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsEditingNote(false);
        setShowSignInPrompt(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isEditingNote, showSignInPrompt]);

  // Prevents the browser's native "move focus to the clicked button" default
  // action before it happens (mousedown fires ahead of click) — same idiom
  // already used by PronunciationSpeedControl for the same reason.
  function handleMouseDown(event: ReactMouseEvent) {
    event.preventDefault();
  }

  // Restoring focus after Bookmark/Save/Delete (Reading Experience Polish,
  // Goal 2) needs to happen strictly after React finishes committing this
  // click's state update, not imperatively inside the click handler itself:
  // toggleBookmark/saveNote fire a "use server" action as part of their
  // updater, and calling `inputRef.current.focus()` synchronously — even
  // deferred one animation frame — could still land while that action's own
  // router-level pending-transition update was being applied, producing a
  // real "Cannot update a component (Router) while rendering a different
  // component (BookMarkControls)" warning (observed live). A state-triggered
  // effect is the React-idiomatic way to run DOM work strictly after commit,
  // so it can never race that transition.
  const [focusRequestId, setFocusRequestId] = useState(0);
  const skipNextFocusEffectRef = useRef(true);
  useEffect(() => {
    if (skipNextFocusEffectRef.current) {
      skipNextFocusEffectRef.current = false;
      return;
    }
    inputRef?.current?.focus();
  }, [focusRequestId, inputRef]);

  function refocusInput() {
    setFocusRequestId((id) => id + 1);
  }

  function handleBookmarkClick() {
    if (!isSignedIn) {
      setShowSignInPrompt((open) => !open);
      return;
    }
    toggleBookmark();
    refocusInput();
  }

  function handleNoteClick() {
    if (!isSignedIn) {
      setShowSignInPrompt((open) => !open);
      return;
    }
    setIsEditingNote((open) => !open);
  }

  function handleSave() {
    saveNote(draft);
    setIsEditingNote(false);
    refocusInput();
  }

  function handleDelete() {
    saveNote(null);
    setDraft("");
    setIsEditingNote(false);
    refocusInput();
  }

  function handleCancel() {
    setDraft(note ?? "");
    setIsEditingNote(false);
    refocusInput();
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={handleBookmarkClick}
        aria-pressed={isSignedIn ? isBookmarked : undefined}
        aria-label={isBookmarked ? t.common.saved : t.common.save}
        title={isBookmarked ? t.common.saved : t.common.save}
        className={cn(
          "focus-visible:ring-primary hover:bg-muted flex size-8 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
          isBookmarked ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Bookmark
          className="size-4"
          fill={isBookmarked ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        onClick={handleNoteClick}
        aria-pressed={isSignedIn ? isEditingNote : undefined}
        aria-label={note ? t.bookLibrary.noteEdit : t.bookLibrary.noteAdd}
        className={cn(
          "focus-visible:ring-primary hover:bg-muted flex size-8 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
          note ? "text-primary" : "text-muted-foreground",
        )}
      >
        <NotebookPen className="size-4" aria-hidden="true" />
      </button>

      {isSignedIn && isEditingNote && (
        <div
          ref={popupRef}
          className={cn(
            "absolute end-0 z-30 w-64",
            flipAbove ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
          style={
            popupShift.x || popupShift.y
              ? { transform: `translate(${popupShift.x}px, ${popupShift.y}px)` }
              : undefined
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            dir={dir}
            className="border-border/60 bg-card rounded-xl border p-2.5 shadow-lg shadow-black/20"
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t.bookLibrary.notePlaceholder}
              rows={3}
              autoFocus
              dir={dir}
              className="border-border/60 bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary w-full resize-none rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-2"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              {note ? (
                <button
                  type="button"
                  onMouseDown={handleMouseDown}
                  onClick={handleDelete}
                  className="text-danger text-xs font-medium hover:underline"
                >
                  {t.bookLibrary.noteDelete}
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={handleMouseDown}
                  onClick={handleCancel}
                  className="text-muted-foreground text-xs font-medium hover:underline"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onMouseDown={handleMouseDown}
                  onClick={handleSave}
                  className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-xs font-medium hover:opacity-90"
                >
                  {t.bookLibrary.noteSave}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {!isSignedIn && showSignInPrompt && (
        <div
          ref={popupRef}
          className={cn(
            "absolute end-0 z-30 w-64",
            flipAbove ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
          style={
            popupShift.x || popupShift.y
              ? { transform: `translate(${popupShift.x}px, ${popupShift.y}px)` }
              : undefined
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            dir={dir}
            role="status"
            className="border-border/60 bg-card rounded-xl border p-2.5 shadow-lg shadow-black/20"
          >
            <p className="text-foreground text-sm">{t.bookLibrary.signInToSave}</p>
            <div className="mt-2 flex justify-end">
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-xs font-medium hover:opacity-90"
              >
                {t.common.signIn}
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
