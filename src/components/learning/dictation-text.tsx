"use client";

import { motion } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { useUnderlinePosition } from "@/components/learning/typing-text";
import type { DictationCell, DictationView } from "@/lib/features/dictation";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const NBSP = " ";

/**
 * How a slot's letter leaves and its blank arrives when Dictation is switched
 * on: a quick wave runs left to right in which every letter drops onto its
 * line (shrinking and blurring as it lands) while the blank draws itself out
 * from the middle just as it arrives. The whole sentence takes about half a
 * second. A typed letter does the same in reverse: it rises off the line.
 */
const INTRO_STEP = 0.006;
const INTRO_MAX_DELAY = 0.28;
const INTRO_TICK_LAG = 0.05;
const INTRO_TOTAL_MS = (INTRO_MAX_DELAY + INTRO_TICK_LAG + 0.22) * 1000 + 80;
/** A fresh sentence (no intro): its blanks just draw in, even quicker. */
const ENTER_STEP = 0.004;
const ENTER_MAX_DELAY = 0.18;
const ENTER_TOTAL_MS = (ENTER_MAX_DELAY + 0.2) * 1000 + 80;

const GLYPH_SHOWN = { opacity: 1, scale: 1, y: "0em", filter: "blur(0px)" };
const GLYPH_HIDDEN = { opacity: 0, scale: 0.6, y: "0.18em", filter: "blur(3px)" };

type Phase = "intro" | "enter" | "idle";

interface DictationTextWords {
  /** Whether the word starting at this graded-word index has a clip to play. */
  hasAudio: (word: number) => boolean;
  label: (word: number) => string;
  onTap: (word: number) => void;
  /** The word being spoken right now: its blanks light up. */
  litWord: number | null;
  /** Its clip is still being fetched: the lit blanks breathe. */
  litPulse: boolean;
}

interface DictationTextProps {
  view: DictationView;
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onEnter: () => void;
  ariaLabel: string;
  /** Draw a blank per letter. Off (the admin option) only echoes what has been typed, so the learner gets no word or letter count. */
  showBlanks: boolean;
  /** The learner just switched Dictation on: start from the real sentence and dissolve it into blanks. */
  playIntro?: boolean;
  reducedMotion: boolean;
  textClassName?: string;
  /** Admin → Fonts' per-section font family, same as TypingText. */
  textStyle?: CSSProperties;
  /** Tapping a blank says its word. Absent where words have no audio of their own. */
  words?: DictationTextWords;
}

/**
 * The Dictation view of the sentence: the very same text layout the typing
 * view draws (same words, spaces, size and wrapping), but every letter is
 * hidden behind a blank. There is no answer box: the learner types straight
 * onto the first blank (a real, invisible input underneath, like TypingText)
 * and what they type appears in place, word by word, while a cursor bar glides
 * along the blanks. Nothing says whether a letter is right until Enter.
 */
export function DictationText({
  view,
  value,
  inputRef,
  onChange,
  onEnter,
  ariaLabel,
  showBlanks,
  playIntro = false,
  reducedMotion,
  textClassName,
  textStyle,
  words,
}: DictationTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Delays apply to the arrival animation only: once it is over, a blank that
  // comes back (backspace) or a letter that is typed responds at once.
  const [phase, setPhase] = useState<Phase>(reducedMotion ? "idle" : playIntro ? "intro" : "enter");
  useEffect(() => {
    if (phase === "idle") return;
    const timer = setTimeout(
      () => setPhase("idle"),
      phase === "intro" ? INTRO_TOTAL_MS : ENTER_TOTAL_MS,
    );
    return () => clearTimeout(timer);
  }, [phase]);

  const barRect = useUnderlinePosition(containerRef, '[data-current-tick="true"]', -4, [
    view.cursor?.word,
    view.cursor?.letter,
    value,
    showBlanks,
  ]);

  let order = 0;

  return (
    <div
      ref={containerRef}
      onClick={() => inputRef.current?.focus()}
      // select-none: the letters are decoration, never something to select or copy.
      className="relative cursor-text outline-none select-none"
    >
      <div
        aria-hidden={words ? undefined : true}
        dir="ltr"
        style={textStyle}
        className={cn("leading-tight font-semibold tracking-wide sm:leading-snug", textClassName)}
      >
        {view.tokens.map((token, tokenIndex) => {
          if (token.kind === "space") {
            return (
              <span key={tokenIndex} aria-hidden="true" className="inline-block">
                {NBSP}
              </span>
            );
          }

          const first = token.firstWord;
          const tappable = words !== undefined && first !== null && words.hasAudio(first);
          const lit = tappable && words.litWord === first;
          const cells = token.cells.map((cell, cellIndex) => {
            if (cell.kind === "slot") {
              const slotOrder = order++;
              return (
                <Slot
                  key={cellIndex}
                  cell={cell}
                  order={slotOrder}
                  current={view.cursor?.word === cell.word && view.cursor.letter === cell.letter}
                  showBlank={showBlanks}
                  lit={lit}
                  pulse={lit && Boolean(words?.litPulse)}
                  phase={phase}
                  reducedMotion={reducedMotion}
                />
              );
            }
            if (cell.kind === "extra") return <TypedLetter key={cellIndex} char={cell.typed} />;
            return (
              <span
                key={cellIndex}
                aria-hidden="true"
                className="inline-block text-[var(--lesson-letter-pending)]"
              >
                {cell.char}
              </span>
            );
          });

          return (
            <span
              key={tokenIndex}
              role={tappable ? "button" : undefined}
              // Tapped with the mouse or a finger only: keyboard users stay in
              // the answer (Shift already replays the whole sentence).
              tabIndex={tappable ? -1 : undefined}
              aria-label={tappable ? words.label(first) : undefined}
              onClick={
                tappable
                  ? (event) => {
                      event.stopPropagation();
                      inputRef.current?.focus();
                      words.onTap(first);
                    }
                  : undefined
              }
              className={cn(
                "group/word relative isolate inline-block whitespace-nowrap",
                tappable &&
                  "cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.045] active:scale-95",
                lit && "scale-[1.045]",
              )}
            >
              {cells}
            </span>
          );
        })}

        {view.extraWords.map((word, index) => (
          <span key={`extra-${index}`}>
            {(view.tokens.length > 0 || index > 0) && (
              <span aria-hidden="true" className="inline-block">
                {NBSP}
              </span>
            )}
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((char, letterIndex) => (
                <TypedLetter key={letterIndex} char={char} />
              ))}
            </span>
          </span>
        ))}

        {!showBlanks && (
          <>
            {!view.typingWord && view.extraWords.length > 0 && (
              <span aria-hidden="true" className="inline-block">
                {NBSP}
              </span>
            )}
            <span className="relative inline-block" aria-hidden="true">
              <span className="invisible">{NBSP}</span>
              <TickTrack current />
            </span>
          </>
        )}
      </div>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-[5px] rounded-full bg-[var(--lesson-underline)]"
        initial={false}
        animate={
          barRect
            ? { x: barRect.x, y: barRect.y, width: barRect.width, opacity: 1 }
            : { opacity: 0 }
        }
        transition={
          reducedMotion ? { duration: 0 } : { type: "tween", duration: 0.16, ease: "easeOut" }
        }
      />

      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          // The answer only grows and shrinks at its end: the caret can't be
          // seen, so moving it into the middle would only cause confusion.
          if (["ArrowLeft", "ArrowUp", "Home"].includes(event.key)) event.preventDefault();
          if (event.key !== "Enter") return;
          event.preventDefault();
          onEnter();
        }}
        onSelect={(event) => {
          const input = event.currentTarget;
          const end = input.value.length;
          if (input.selectionStart !== end || input.selectionEnd !== end) {
            input.setSelectionRange(end, end);
          }
        }}
        // Same rule as the keystroke engine: this exercise is typed, not pasted.
        onPaste={(event) => event.preventDefault()}
        className="pointer-events-none absolute inset-0 cursor-text opacity-0"
        dir="ltr"
        aria-label={ariaLabel}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
      />
    </div>
  );
}

/**
 * The line a blank is drawn as. The wrapper is the slot's own width and never
 * transforms, so the cursor bar can measure it; the visible line inside scales
 * and fades. `invisible` keeps the measuring box for the freeform caret.
 */
function TickTrack({ current = false, children }: { current?: boolean; children?: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      data-current-tick={current ? "true" : undefined}
      className="pointer-events-none absolute inset-x-0 bottom-[0.17em] flex h-[0.05em] min-h-[2px] justify-center"
    >
      {children}
    </span>
  );
}

function TypedLetter({ char }: { char: string }) {
  return (
    <span aria-hidden="true" className="inline-block text-[var(--lesson-letter-correct)]">
      {char}
    </span>
  );
}

/**
 * What a slot's glyph paints, and the one rule that keeps the answer secret:
 * the slot's real letter is only ever painted while the intro dissolves the
 * sentence into its blanks, and only in a slot nobody has typed in. Everywhere
 * else the glyph paints the learner's own letter, or nothing.
 *
 * The glyph is both the slot's width (it holds a letter) and a letter that
 * fades in and out, and erasing a letter empties the slot in the very render
 * that starts the fade. Reading the letter straight from the slot would
 * therefore swap the learner's wrong letter for the real one while it is still
 * fully visible: after every erased mistake the correct letter flashed for a
 * moment. So an erased letter is remembered and keeps being painted until its
 * fade has ended (`settle`); only then does the slot go back to being sized by
 * the real letter, and from that point on it is `concealed` outright (not just
 * transparent, which would depend on the animation having been applied to the
 * page by the time the letter is swapped).
 */
function useSlotGlyph(typed: string | null, real: string, intro: boolean) {
  const [memory, setMemory] = useState<{ letter: string; gone: boolean } | null>(null);
  if (typed !== null && (memory === null || memory.gone || memory.letter !== typed)) {
    setMemory({ letter: typed, gone: false });
  }
  const leaving = typed === null && memory !== null && !memory.gone ? memory.letter : null;
  const showsReal = typed === null && leaving === null;
  const revealsReal = intro && memory === null;

  return {
    char: typed ?? leaving ?? real,
    revealsReal,
    concealed: showsReal && !revealsReal,
    /** The erased letter has faded out. */
    settle: () =>
      setMemory((current) => (current && !current.gone ? { ...current, gone: true } : current)),
  };
}

function Slot({
  cell,
  order,
  current,
  showBlank,
  lit,
  pulse,
  phase,
  reducedMotion,
}: {
  cell: Extract<DictationCell, { kind: "slot" }>;
  /** Position of this slot among all the slots of the sentence, for the stagger. */
  order: number;
  current: boolean;
  showBlank: boolean;
  lit: boolean;
  pulse: boolean;
  phase: Phase;
  reducedMotion: boolean;
}) {
  const filled = cell.typed !== null;
  const glyph = useSlotGlyph(cell.typed, cell.char, phase === "intro");

  const introDelay = Math.min(order * INTRO_STEP, INTRO_MAX_DELAY);
  const glyphDelay = glyph.revealsReal ? introDelay : 0;
  const tickDelay =
    filled || reducedMotion
      ? 0
      : phase === "intro"
        ? introDelay + INTRO_TICK_LAG
        : phase === "enter"
          ? Math.min(order * ENTER_STEP, ENTER_MAX_DELAY)
          : 0;

  return (
    <span className="relative inline-block">
      {/*
        The letter itself is drawn by CSS from data-ch, never as DOM text: it is
        only there to give the slot its natural width (so nothing moves when a
        blank is filled, or when the sentence first dissolves), and that way it
        can't be found with Ctrl+F or read out. What is shown in a filled slot
        is the learner's own letter; see useSlotGlyph for when the real one may
        be painted (only ever while the intro dissolves it).
      */}
      <motion.span
        aria-hidden="true"
        data-ch={glyph.char}
        // The first frame of the intro is the real sentence; every other
        // slot starts hidden so a new sentence never flashes its text.
        initial={reducedMotion ? false : phase === "intro" || filled ? GLYPH_SHOWN : GLYPH_HIDDEN}
        animate={filled ? GLYPH_SHOWN : GLYPH_HIDDEN}
        onAnimationComplete={() => {
          if (!filled) glyph.settle();
        }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: filled ? 0.18 : 0.22, delay: glyphDelay, ease: easeOut }
        }
        className={cn(
          "inline-block transition-colors duration-150 before:content-[attr(data-ch)]",
          filled ? "text-[var(--lesson-letter-correct)]" : "text-[var(--lesson-letter-pending)]",
          glyph.concealed && "invisible",
        )}
      />
      {showBlank && (
        <TickTrack current={current}>
          <motion.span
            initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
            animate={filled ? { scaleX: 0.4, opacity: 0 } : { scaleX: 1, opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: filled ? 0.12 : 0.2, delay: tickDelay, ease: easeOut }
            }
            className={cn(
              "block h-full w-[max(calc(100%-0.16em),0.3em)] rounded-full bg-[var(--lesson-letter-pending)] transition-colors duration-200 group-hover/word:bg-[var(--lesson-primary)]",
              lit && "bg-[var(--lesson-primary)]",
              pulse && "animate-pulse",
            )}
          />
        </TickTrack>
      )}
    </span>
  );
}
