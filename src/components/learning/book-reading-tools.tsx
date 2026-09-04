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
import {
  Bookmark,
  Check,
  NotebookPen,
  Rabbit,
  Snail,
  SlidersHorizontal,
  Turtle,
} from "lucide-react";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useBookSentenceMark } from "@/hooks/use-book-marks";
import { cn } from "@/lib/utils";
import type { BookSentenceMark } from "@/lib/book-progress/marks";

const SPEED_ICONS = [Rabbit, Turtle, Snail];

type PanelView = "closed" | "menu" | "note" | "signin";

/**
 * One combined trigger for every per-sentence Book Reading control — Save,
 * Note, and pronunciation Speed — replacing the three separate floating
 * icons/pill this used to be (Bookmark + NotebookPen buttons here, plus
 * BookSentenceReader rendering its own PronunciationSpeedControl alongside
 * them). Reading feedback was that three things floating directly above the
 * sentence read as "editing toolbar," not "reading a book." A single
 * trigger keeps the page visually quiet by default (research on Apple
 * Books/Kindle/Chrome Reading Mode all converge on the same "one control
 * that opens a menu" shape for exactly this reason) while every action
 * still costs at most one extra click to reach.
 *
 * Bookmark + Note keep their original private-annotation behavior and data
 * flow entirely (see useBookSentenceMark) — only Speed is new here: it used
 * to be BookSentenceReader's own PronunciationSpeedControl (a persistent
 * fixed pill), folded into this menu as a row instead so cycling speed
 * doesn't need its own separate floating control. Every other caller of
 * PronunciationSpeedControl (normal lessons, stories, conversation, word
 * lists) is untouched — that component still exists and still owns its own
 * fixed-pill rendering there.
 */
export function BookReadingTools({
  bookId,
  sentenceId,
  inputRef,
  mark,
  showSpeed = true,
}: {
  bookId: string;
  sentenceId: string;
  /**
   * The active sentence's typing input (Reading Experience Polish, Goal 2).
   * Clicking any real `<button>` here would otherwise move DOM focus to it,
   * forcing the learner to click the sentence again to keep typing. Restored
   * once the whole panel closes (see the outside-click handler below) — not
   * after every row action, since the menu deliberately stays open across a
   * Bookmark toggle or a Speed cycle so the learner can see the row update
   * (see handleBookmarkToggle/handleSpeedCycle's own comments).
   */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** This sentence's Save/Note state, already fetched in one batched request for the whole reading page — see useBookSentenceMark's own doc comment for why this avoids an N+1. */
  mark: BookSentenceMark;
  /** False for a page-navigation preview sentence (BookSentenceReader's readOnly) — pronunciation speed is a global session setting, not per-sentence, and the old dedicated speed pill it replaces was likewise never shown there. */
  showSpeed?: boolean;
}) {
  const { t, dir } = useLocale();
  const { isSignedIn, isBookmarked, note, toggleBookmark, saveNote } = useBookSentenceMark(
    bookId,
    sentenceId,
    mark,
  );
  const { isActive: speedIsActive, speedIndex, cycleSpeed } = usePronunciationSettings();
  const [view, setView] = useState<PanelView>("closed");
  const [draft, setDraft] = useState(note ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const open = view !== "closed";
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
    if (view !== "note") setDraft(note ?? "");
  }, [note, view]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setView("closed");
        refocusInput();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Prevents the browser's native "move focus to the clicked button" default
  // action before it happens (mousedown fires ahead of click) — same idiom
  // already used by PronunciationSpeedControl for the same reason.
  function handleMouseDown(event: ReactMouseEvent) {
    event.preventDefault();
  }

  // Restoring focus once the whole panel closes (Reading Experience Polish,
  // Goal 2) needs to happen strictly after React finishes committing this
  // click's state update, not imperatively inside the click handler itself:
  // toggleBookmark/saveNote fire a "use server" action as part of their
  // updater, and calling `inputRef.current.focus()` synchronously — even
  // deferred one animation frame — could still land while that action's own
  // router-level pending-transition update was being applied, producing a
  // real "Cannot update a component (Router) while rendering a different
  // component (BookReadingTools)" warning (observed live on the previous,
  // narrower version of this component). A state-triggered effect is the
  // React-idiomatic way to run DOM work strictly after commit, so it can
  // never race that transition.
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

  function handleTriggerClick() {
    setView((current) => (current === "closed" ? "menu" : "closed"));
  }

  // Deliberately keeps the panel open afterward (unlike the old direct
  // Bookmark icon, which toggled and was done): the row's own icon/label
  // update in place, so staying open is what actually lets the learner see
  // "yes, that saved" before they close the menu themselves.
  function handleBookmarkToggle() {
    if (!isSignedIn) {
      setView("signin");
      return;
    }
    toggleBookmark();
  }

  function handleNoteRowClick() {
    if (!isSignedIn) {
      setView("signin");
      return;
    }
    setView("note");
  }

  // Same reasoning as handleBookmarkToggle: cycling is a repeated action
  // (Normal → Slow → Very slow → Normal), so closing the menu after one
  // click would force the learner to reopen it twice more just to reach
  // Very slow. Never gated on isSignedIn — playback speed is a session
  // preference, not a persisted per-account annotation.
  function handleSpeedCycle() {
    cycleSpeed();
  }

  function handleSave() {
    saveNote(draft);
    setView("closed");
    refocusInput();
  }

  function handleDelete() {
    saveNote(null);
    setDraft("");
    setView("closed");
    refocusInput();
  }

  function handleCancel() {
    setDraft(note ?? "");
    setView("closed");
    refocusInput();
  }

  const SPEED_LABELS = [
    t.pronunciation.normalSpeed,
    t.pronunciation.slow,
    t.pronunciation.verySlow,
  ];
  const speedLabel = SPEED_LABELS[speedIndex] ?? t.pronunciation.normalSpeed;
  const SpeedIcon = SPEED_ICONS[speedIndex] ?? Rabbit;
  const speedLevel = 3 - speedIndex; // Normal=3, Slow=2, Very slow=1 — "more lit dots = faster"
  const hasAnnotation = isBookmarked || Boolean(note);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onClick={handleTriggerClick}
        aria-expanded={open}
        aria-label={t.bookLibrary.readingToolsLabel}
        title={t.bookLibrary.readingToolsLabel}
        className={cn(
          "group border-border/60 bg-card inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 ease-out",
          "hover:border-primary/35 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97]",
          open ? "border-primary/40 text-primary" : "text-foreground",
        )}
      >
        <SlidersHorizontal
          className="text-primary size-3.5 transition-transform duration-300 ease-out group-hover:rotate-90"
          aria-hidden="true"
        />
        {t.bookLibrary.readingToolsLabel}
        {hasAnnotation && (
          <span className="bg-primary size-1.5 shrink-0 rounded-full" aria-hidden="true" />
        )}
      </button>

      {open && (
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
            className="border-border/60 bg-card rounded-xl border p-1.5 shadow-lg shadow-black/20"
          >
            {view === "menu" && (
              <>
                <button
                  type="button"
                  onMouseDown={handleMouseDown}
                  onClick={handleBookmarkToggle}
                  aria-pressed={isSignedIn ? isBookmarked : undefined}
                  className={cn(
                    "hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm font-medium transition-colors",
                    isBookmarked ? "text-primary" : "text-foreground",
                  )}
                >
                  <Bookmark
                    className="size-4"
                    fill={isBookmarked ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{isBookmarked ? t.common.saved : t.common.save}</span>
                  {isBookmarked && <Check className="size-3.5" aria-hidden="true" />}
                </button>

                <button
                  type="button"
                  onMouseDown={handleMouseDown}
                  onClick={handleNoteRowClick}
                  className={cn(
                    "hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm font-medium transition-colors",
                    note ? "text-primary" : "text-foreground",
                  )}
                >
                  <NotebookPen className="size-4" aria-hidden="true" />
                  <span className="flex-1">
                    {note ? t.bookLibrary.noteEdit : t.bookLibrary.noteAdd}
                  </span>
                </button>

                {speedIsActive && showSpeed && (
                  <>
                    <div className="bg-border my-1 h-px" aria-hidden="true" />
                    <button
                      type="button"
                      onMouseDown={handleMouseDown}
                      onClick={handleSpeedCycle}
                      aria-label={t.pronunciation.speedButtonLabel
                        .replace("{label}", speedLabel)
                        .replace("{level}", String(speedLevel))}
                      className="hover:bg-muted text-foreground flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start text-sm font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <SpeedIcon className="text-muted-foreground size-4" aria-hidden="true" />
                        {speedLabel}
                      </span>
                      <span className="flex items-center gap-0.5" aria-hidden="true">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className={cn(
                              "size-1 rounded-full transition-colors duration-200",
                              dot < speedLevel ? "bg-primary" : "bg-border",
                            )}
                          />
                        ))}
                      </span>
                    </button>
                  </>
                )}
              </>
            )}

            {view === "note" && isSignedIn && (
              <div className="p-1">
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
              </div>
            )}

            {view === "signin" && !isSignedIn && (
              <div className="p-1" role="status">
                <p className="text-foreground px-1 pt-1 text-sm">{t.bookLibrary.signInToSave}</p>
                <div className="mt-2 flex justify-end">
                  <Link
                    href={`/login?next=${encodeURIComponent(pathname)}`}
                    className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-xs font-medium hover:opacity-90"
                  >
                    {t.common.signIn}
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
