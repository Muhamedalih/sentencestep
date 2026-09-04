"use client";

import { motion } from "framer-motion";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type CSSProperties,
  type RefObject,
} from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { easeOut } from "@/lib/motion";
import { getCurrentWordIndex, tokenize } from "@/lib/typing";
import type { LetterState } from "@/lib/typing";
import { cn } from "@/lib/utils";

const NBSP = " ";

const REPEAT_CLICK_DETAIL_THRESHOLD = 1;

interface TypingTextProps {
  target: string;
  typed: string;
  letterStates: LetterState[];
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  reducedMotion?: boolean;
  className?: string;
  textClassName?: string;
  /** Admin -> Fonts' per-section font-family override (see resolveSectionFontFamily), applied as an inline style since the value is only known at request time — undefined (the default) leaves textClassName's own font untouched. */
  textStyle?: CSSProperties;
  /** Pronounces a single clicked word (see use-speech.ts) — never restarts or affects the full-sentence audio. Also receives the word's index (position among non-space tokens) — additive, every existing caller already only reads the first argument. */
  onWordClick?: (word: string, index: number) => void;
  /**
   * Hides `target`'s real characters at every position the learner hasn't
   * confirmed yet (letterStates "current" and "pending" render as a blank
   * tick instead of the real glyph) — for Word Lists' fill-in-the-blank gap
   * (see VocabularySentence), where the whole point is that the answer
   * isn't visible before it's typed. Every other lesson mode leaves this
   * off and keeps today's always-visible-target rendering unchanged.
   */
  obscureUntyped?: boolean;
  /** The actual (possibly wrong) character the learner just typed at `letterStates`' error index — shown instead of target's own letter so a mistake reveals what was typed, never the hidden answer. Only read when obscureUntyped is set. */
  errorChar?: string | null;
  /**
   * Book Reading's word-by-word translation gloss (Book Reading Experience
   * Enhancements, addition 1) — aligned by index to `target`'s non-space
   * word tokens, same shape/order as BookSentence.supportWordTranslations.
   * Purely additive and opt-in: absent for every other caller (normal/
   * stories/conversation typing, mistake review), which keeps every word
   * click there exactly as instant and side-effect-free as it already was.
   * When present, a single click also reveals that word's translation in a
   * small popover (a second click of the same word closes it again), and
   * double-click becomes available to toggle a highlight on the word.
   */
  wordTranslations?: { en: string; text: string }[];
  /** The support locale's writing direction, for the translation popover's own text (see WordTranslationPopover) — never used to flip the English sentence itself, which stays LTR unconditionally. Only meaningful when wordTranslations is set. */
  translationDir?: "rtl" | "ltr";
  /**
   * Story Vocabulary feature (see src/lib/content/story-vocabulary.ts) —
   * word indices (into `target`'s non-space tokens, same indexing as
   * wordTranslations) to mark with a subtle, always-on dotted underline as
   * "a useful word from this story." Deliberately independent of
   * wordTranslations/enableWordHighlight (Book Reading's click-to-reveal
   * and toggle-highlight): this is a passive, non-interactive cue, not a
   * click target, and never changes onWordClick's pronunciation behavior.
   * Purely additive and opt-in — every other caller leaves this unset and
   * renders exactly as before.
   */
  targetVocabularyIndices?: ReadonlySet<number>;
  /**
   * Enables double-click-to-highlight (addition 3) for every word in this
   * sentence, independent of whether `wordTranslations` has data for any
   * given word — highlighting is a Book Reading feature, not a translation
   * feature, and most sentences across the library have no word-level gloss
   * yet. Gating double-click on `wordTranslations` instead (an earlier
   * version of this component did exactly that) silently disabled
   * highlighting everywhere except the handful of sentences with word-level
   * data, which is not what "double-click any word to highlight it" means.
   * Still scoped to Book Reading only: every other caller leaves this unset
   * and keeps double-click completely inert, exactly as before.
   */
  enableWordHighlight?: boolean;
  /** Whether to show the moving per-character/per-word typing-progress underline — true (default) for every live typing screen. Book Reading's read-only page-preview rendering (a sentence the learner isn't actively typing, just browsing to) sets this false: there is no "current" position to indicate there. */
  showTypingCursor?: boolean;
  /** Disables the underlying (invisible) input and skips autoFocus — Book Reading's read-only page-preview rendering, so navigating pages never steals focus or accepts keystrokes for a sentence that isn't the active one. */
  disabled?: boolean;
  /**
   * Fix Your Mistakes' red-letter hint (addition — see MistakeReviewSentence):
   * every character index within `target` the learner previously got wrong,
   * shown in the same red used for an active typing mistake. Only ever
   * applied while that position's own letterState is still "pending" or
   * "current" — the instant it's typed (state becomes "correct", or briefly
   * "error" on a fresh wrong keystroke, which is already red) this stops
   * doing anything, so a completed word reads with exactly the same styling
   * as any other completed word, with no separate reset needed. Absent for
   * every other caller, which keeps them completely unaffected.
   */
  highlightIndexes?: ReadonlySet<number> | null;
}

interface UnderlineRect {
  x: number;
  y: number;
  width: number;
}

/**
 * Renders the target sentence as per-character spans (correct / current /
 * error / pending) over an invisible native input that actually captures
 * keystrokes — real text input under the hood means mobile keyboards, IME,
 * and native backspace all just work. Shared by every lesson mode; only the
 * chrome around it (card vs. chat bubble, etc.) differs per mode.
 */
export function TypingText({
  target,
  typed,
  letterStates,
  inputRef,
  onChange,
  onPaste,
  reducedMotion = false,
  className,
  textClassName,
  textStyle,
  onWordClick,
  obscureUntyped = false,
  errorChar = null,
  wordTranslations,
  translationDir = "ltr",
  targetVocabularyIndices,
  enableWordHighlight = false,
  showTypingCursor = true,
  disabled = false,
  highlightIndexes = null,
}: TypingTextProps) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  // Which word's translation popover is open (at most one at a time — clean
  // and lightweight rather than a sentence full of open popovers) and which
  // words are double-click-highlighted. Local, transient UI state: both
  // naturally reset for free whenever this component remounts for a new
  // sentence (every caller keys its typing screen by sentence id already),
  // so no explicit reset-on-target-change effect is needed.
  const [revealedWordIndex, setRevealedWordIndex] = useState<number | null>(null);
  const [highlightedWordIndices, setHighlightedWordIndices] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const underlineRect = useUnderlinePosition(containerRef, '[data-current="true"]', 3, [
    target,
    typed,
    letterStates,
  ]);

  // Word-level indicator only makes sense on the same screens that already
  // expose per-word interaction (the translation card + word click, gated
  // by onWordClick) — conversation bubbles never got either, so leaving
  // this off there too keeps that mode visually untouched, per Milestone
  // 4's scope. Derived from the same getCurrentWordIndex used by
  // CurrentWordCard, so the translation card and this underline can never
  // disagree about which word is "current."
  const showWordUnderline = showTypingCursor && Boolean(onWordClick);
  const currentWordIndex = showWordUnderline ? getCurrentWordIndex(target, typed.length) : -1;
  const wordUnderlineRect = useUnderlinePosition(containerRef, '[data-current-word="true"]', 3, [
    target,
    typed,
    currentWordIndex,
    showWordUnderline,
  ]);

  let charIndex = 0;
  let wordIndex = -1;

  return (
    <div
      ref={containerRef}
      onClick={() => inputRef.current?.focus()}
      className={cn("relative cursor-text outline-none", className)}
    >
      <div
        aria-hidden="true"
        dir="ltr"
        style={textStyle}
        className={cn("leading-tight font-semibold tracking-wide sm:leading-snug", textClassName)}
      >
        {tokenize(target).map((token, tokenIndex) => {
          if (token === " ") {
            const index = charIndex;
            charIndex += 1;
            const state = letterStates[index] ?? "pending";
            return (
              <Letter
                key={`token-${tokenIndex}`}
                state={state}
                display={NBSP}
                reducedMotion={reducedMotion}
              />
            );
          }

          const startIndex = charIndex;
          charIndex += token.length;
          wordIndex += 1;
          const isCurrentWord = showWordUnderline && wordIndex === currentWordIndex;
          const thisWordIndex = wordIndex;
          const translation = wordTranslations?.[thisWordIndex];
          const isRevealed = wordTranslations !== undefined && revealedWordIndex === thisWordIndex;
          const isHighlighted = highlightedWordIndices.has(thisWordIndex);
          const isTargetVocabulary = targetVocabularyIndices?.has(thisWordIndex) ?? false;

          // MouseEvent.detail is the native click-count (1 for a plain
          // click, 2+ for the second click of a double-click) — checking it
          // lets a double-click's first click still fire the ordinary
          // single-click actions (pronunciation, translation toggle) with
          // zero artificial delay, while its second click skips them, so
          // there's never a double-fired pronunciation or a visible
          // open-then-close popover flicker on a genuine double-click.
          // Highlighting itself is NOT part of this: it's driven solely by
          // onDoubleClick below, so a single click can never add or remove
          // a highlight — see enableWordHighlight's own doc comment.
          function playWord(event: { stopPropagation: () => void; detail?: number }) {
            event.stopPropagation();
            if (
              (wordTranslations || enableWordHighlight) &&
              (event.detail ?? 0) > REPEAT_CLICK_DETAIL_THRESHOLD
            )
              return;
            inputRef.current?.focus();
            onWordClick?.(token, thisWordIndex);
            if (wordTranslations) {
              setRevealedWordIndex((prev) => (prev === thisWordIndex ? null : thisWordIndex));
            }
          }

          function toggleHighlight(event: {
            stopPropagation: () => void;
            preventDefault: () => void;
          }) {
            event.stopPropagation();
            event.preventDefault(); // skip the browser's own word-selection on double-click
            setHighlightedWordIndices((prev) => {
              const next = new Set(prev);
              if (next.has(thisWordIndex)) next.delete(thisWordIndex);
              else next.add(thisWordIndex);
              return next;
            });
          }

          return (
            <span
              key={`token-${tokenIndex}`}
              data-current-word={isCurrentWord ? "true" : undefined}
              onClick={playWord}
              onDoubleClick={enableWordHighlight ? toggleHighlight : undefined}
              // The browser's own word-selection on double-click begins at
              // the second click's mousedown, before the dblclick event
              // (and therefore toggleHighlight's own preventDefault) ever
              // fires — by then the selection already exists. Preventing
              // default here, at mousedown, is what actually stops it; the
              // click/dblclick events themselves are unaffected and still
              // fire normally. Scoped to enableWordHighlight (Book Reading)
              // only, leaving every other caller's native selection
              // behavior untouched.
              onMouseDown={enableWordHighlight ? (event) => event.preventDefault() : undefined}
              role={onWordClick ? "button" : undefined}
              tabIndex={onWordClick ? 0 : undefined}
              aria-label={
                onWordClick ? t.pronunciation.pronounceWord.replace("{word}", token) : undefined
              }
              onKeyDown={
                onWordClick
                  ? (event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      playWord(event);
                    }
                  : undefined
              }
              className={cn(
                // `isolate` forces this span to establish its own stacking
                // context unconditionally. Without it, `position: relative`
                // alone does NOT create one (a bare z-index-less relative
                // element doesn't) — the span only gained a stacking context
                // while `:hover` was active, because `hover:scale-[1.045]`
                // applies a `transform`, which does establish one. That made
                // HighlightMark's `-z-10` resolve against a different
                // ancestor stacking context depending on hover state, so the
                // persistent highlight (driven purely by highlightedWordIndices
                // below, never by hover) visually vanished the instant the
                // mouse left the word and reappeared on re-hover, even though
                // nothing about the actual highlight state ever changed.
                // `isolate` makes the stacking context permanent so the mark's
                // z-index always resolves the same way, hover or not.
                "focus-visible:ring-primary relative isolate inline-block cursor-pointer whitespace-nowrap transition-transform duration-200 ease-out hover:scale-[1.045] focus-visible:ring-2 focus-visible:outline-none",
                // Subtle, always-on cue — never affects layout height meaningfully
                // (underline-offset keeps it clear of the glyphs) and never
                // changes click/keyboard behavior, which stays driven by
                // onWordClick/onKeyDown exactly as before.
                isTargetVocabulary &&
                  "decoration-primary/40 underline decoration-dotted underline-offset-[6px]",
              )}
            >
              {isHighlighted && <HighlightMark reducedMotion={reducedMotion} />}
              {token.split("").map((char, i) => {
                const index = startIndex + i;
                const state = letterStates[index] ?? "pending";
                // The whole reason obscureUntyped exists: a "current" or
                // "pending" position must never render target's own
                // character (that's the hidden answer). "error" shows what
                // the learner actually typed, not the correct letter
                // recolored red — recoloring the real answer red would leak
                // it at exactly the moment it's supposed to stay hidden.
                const blank = obscureUntyped && (state === "current" || state === "pending");
                const display = obscureUntyped && state === "error" ? (errorChar ?? char) : char;
                return (
                  <Letter
                    key={index}
                    state={state}
                    display={display}
                    blank={blank}
                    reveal={obscureUntyped}
                    reducedMotion={reducedMotion}
                    highlight={highlightIndexes?.has(index) ?? false}
                  />
                );
              })}
              {isRevealed && translation && (
                <WordTranslationPopover text={translation.text} dir={translationDir} />
              )}
            </span>
          );
        })}
      </div>
      {showWordUnderline && (
        <motion.div
          aria-hidden="true"
          className="bg-muted-foreground/50 pointer-events-none absolute top-0 left-0 h-[2px] rounded-full"
          initial={false}
          animate={
            wordUnderlineRect
              ? {
                  x: wordUnderlineRect.x,
                  y: wordUnderlineRect.y,
                  width: wordUnderlineRect.width,
                  opacity: 1,
                }
              : { opacity: 0 }
          }
          transition={
            reducedMotion ? { duration: 0 } : { type: "tween", duration: 0.18, ease: "easeOut" }
          }
        />
      )}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-[5px] rounded-full bg-[var(--lesson-underline)]"
        initial={false}
        animate={
          underlineRect
            ? { x: underlineRect.x, y: underlineRect.y, width: underlineRect.width, opacity: 1 }
            : { opacity: 0 }
        }
        transition={
          reducedMotion ? { duration: 0 } : { type: "tween", duration: 0.16, ease: "easeOut" }
        }
      />
      <input
        ref={inputRef}
        value={typed}
        onChange={onChange}
        onPaste={onPaste}
        className="pointer-events-none absolute inset-0 cursor-text opacity-0"
        dir="ltr"
        autoFocus={!disabled}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        // obscureUntyped's whole point is that target isn't visible yet —
        // spelling it out here would still hand it to a screen reader or
        // anyone inspecting the accessibility tree, so this is the one
        // spot in the component that must not just default to `target`.
        aria-label={
          obscureUntyped
            ? t.typing.typeMissingWord
            : t.typing.typeThisSentence.replace("{sentence}", target)
        }
      />
    </div>
  );
}

/**
 * The double-click highlight's "someone quickly dragged a highlighter
 * across it by hand" mark — a single absolutely-positioned layer sitting
 * behind the word (negative z-index within the word span's own stacking
 * context — the span forces one unconditionally via `isolate`, so this
 * always resolves the same way regardless of hover), never touching the
 * letters' own DOM nodes or layout. A quick scaleX sweep from
 * the word's own left edge (the English word is always LTR-rendered, even
 * inside an RTL interface — see TypingText's outer `dir="ltr"` wrapper — so
 * "left" here is unconditionally the sweep's true start, no RTL branch
 * needed) plus a fixed slight rotation and asymmetric corner radii is what
 * keeps it reading as hand-drawn rather than a perfect CSS rectangle,
 * without an SVG path or any animation library beyond the framer-motion
 * this file already depends on. `reducedMotion` skips the sweep and shows
 * the mark in its settled state immediately, matching every other animated
 * element in this file.
 */
function HighlightMark({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={reducedMotion ? false : { scaleX: 0, opacity: 0.3, rotate: -0.6 }}
      animate={{ scaleX: 1, opacity: 1, rotate: -0.6 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.22, ease: easeOut }}
      style={{ transformOrigin: "left center", borderRadius: "3px 8px 4px 7px / 6px 3px 7px 4px" }}
      className="bg-accent/45 pointer-events-none absolute -inset-x-[0.18em] -inset-y-[0.05em] -z-10"
    />
  );
}

/**
 * A single word's translation, revealed on click — Book Reading's word-by-
 * word translation interaction (addition 1). Positioned relative to the
 * word's own span (not the whole sentence), so it's correctly placed above
 * that exact word regardless of where the word falls in the line-wrapped
 * sentence, with no shared-position measurement needed the way the typing
 * cursor underline requires. `dir` governs only this popover's own text
 * (the translation) — the English word underneath is unaffected, exactly
 * like every other translation label in this codebase (see CurrentWordCard,
 * BookSentenceReader's supportText paragraph).
 */
function WordTranslationPopover({ text, dir }: { text: string; dir: "rtl" | "ltr" }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15, ease: easeOut }}
      dir={dir}
      className="border-border/60 bg-card text-foreground pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 max-w-[min(70vw,180px)] -translate-x-1/2 rounded-md border px-2 py-1 text-center text-xs font-medium shadow-lg shadow-black/20"
    >
      {text}
    </motion.span>
  );
}

/**
 * Measures the current *character's* real rendered box relative to its
 * container and re-measures whenever the typing state changes, the viewport
 * resizes, the container's own box changes size (a ResizeObserver catches
 * webfont-swap reflow that neither event fires for), or the document's
 * fonts finish loading (the first measurement can otherwise land against
 * fallback-font metrics a few pixels off from the final font). Never
 * derives position from character counts/widths, which is what keeps it
 * correct across line-wrapping and the clamp()-based responsive font size.
 *
 * This is the moving accent-colored indicator — the only underline the
 * sentence renders; there is no static baseline underneath the text itself,
 * so this bar is the sole visual cue for typing position. It tracks the
 * single current character (including a space, which is a real character
 * position with its own box) one at a time; it is not tied
 * to which word the learner is on, which is a completely independent
 * concept driven by getCurrentWordIndex in TypingSentence for the
 * translation card. See that component's doc comment for the distinction.
 *
 * Looks the current element up by a data attribute selector (`[data-current]`
 * for the character, `[data-current-word]` for the word-level underline
 * below) via a fresh `querySelector` on every measurement rather than
 * holding a React ref that gets handed from one element to the next — a ref
 * handed off between sibling elements this way depends on framer-motion's
 * own ref merging running before this effect does, which isn't guaranteed,
 * and empirically it stayed pointed at whichever element had last held the
 * ref instead of moving to the new one. Querying the live DOM after each
 * commit has no such ordering dependency. Both the character and word
 * indicators share this one measuring implementation so they can never
 * drift into different positioning logic.
 */
function useUnderlinePosition(
  containerRef: RefObject<HTMLDivElement | null>,
  selector: string,
  yOffset: number,
  deps: readonly unknown[],
): UnderlineRect | null {
  const [rect, setRect] = useState<UnderlineRect | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;

    function measure() {
      const containerEl = containerRef.current;
      const targetEl = containerEl?.querySelector<HTMLElement>(selector);
      if (!containerEl || !targetEl) {
        setRect(null);
        return;
      }
      const containerBox = containerEl.getBoundingClientRect();
      const targetBox = targetEl.getBoundingClientRect();
      setRect({
        x: targetBox.left - containerBox.left,
        y: targetBox.bottom - containerBox.top + yOffset,
        width: targetBox.width,
      });
    }

    measure();

    const resizeObserver = container ? new ResizeObserver(measure) : null;
    if (container) resizeObserver?.observe(container);
    window.addEventListener("resize", measure);
    document.fonts?.ready?.then(measure).catch(() => {});

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return rect;
}

function Letter({
  state,
  display,
  blank = false,
  reveal = false,
  reducedMotion,
  highlight = false,
}: {
  state: LetterState;
  display: string;
  /** Render a placeholder tick instead of `display` — the character is still hidden. */
  blank?: boolean;
  /**
   * Word Lists' gap only: pop each letter in as it's confirmed correct,
   * rather than just recoloring already-visible text — since the glyph
   * itself is appearing for the first time here (see obscureUntyped), the
   * reveal deserves its own motion, not just a color transition. Keyed by
   * `state` so it replays exactly once per transition into "correct" (a
   * genuine remount, not a re-animated shared element) and never touches
   * the other lesson modes, where every character is visible from the
   * start and a color fade is all a completed letter needs.
   */
  reveal?: boolean;
  reducedMotion: boolean;
  /** Fix Your Mistakes' red-letter hint (see TypingText's highlightIndex) — only ever changes anything while `state` is still "pending"/"current"; a "correct" or transient "error" letter already has its own color and ignores this. */
  highlight?: boolean;
}) {
  const content = blank ? <BlankTick current={state === "current"} /> : display;
  const highlightPending = highlight && (state === "current" || state === "pending");

  return (
    <motion.span
      data-current={state === "current" ? "true" : undefined}
      animate={!reducedMotion && state === "error" ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative inline-block transition-colors duration-150",
        state === "correct" && "text-[var(--lesson-letter-correct)]",
        state === "error" && "text-[var(--lesson-letter-wrong)]",
        (state === "current" || state === "pending") &&
          !blank &&
          (highlightPending
            ? "text-[var(--lesson-letter-wrong)]"
            : "text-[var(--lesson-letter-pending)]"),
      )}
    >
      {reveal && !blank ? (
        <motion.span
          key={state}
          initial={!reducedMotion && state === "correct" ? { scale: 0.4, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22, ease: easeOut }}
          className="inline-block"
        >
          {content}
        </motion.span>
      ) : (
        content
      )}
    </motion.span>
  );
}

/**
 * The gap's blank placeholder for a not-yet-typed letter — a fixed-width
 * tick rather than the real glyph recolored, so letter *shape* (an "i" vs
 * an "m") never leaks the answer either, and rather than an actual "_"
 * character, so it can't be selected/copied as text. Every blank renders
 * identically regardless of the real letter underneath; only the moving
 * accent underline (see useUnderlinePosition) marks which one is current.
 */
function BlankTick({ current }: { current: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mx-[0.05em] mb-[0.14em] inline-block h-[2px] w-[0.6em] rounded-full align-baseline transition-colors duration-150",
        current ? "bg-[var(--lesson-underline)]" : "bg-[var(--lesson-letter-pending)]",
      )}
    />
  );
}
