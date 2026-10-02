"use client";

import { motion } from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

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

/**
 * Show the word: each real letter rises onto its line and comes into focus,
 * one after another (a springy overshoot as it lands), and when the peek ends
 * they float up and dissolve in the same order. The stagger is measured from
 * the word's first letter, so a long word still takes well under half a second.
 */
const GLYPH_PEEK_OUT = { opacity: 0, scale: 0.9, y: "-0.14em", filter: "blur(6px)" };
const PEEK_STAGGER_IN = 0.035;
const PEEK_STAGGER_OUT = 0.03;
const PEEK_MAX_STAGGER_IN = 0.24;
const PEEK_MAX_STAGGER_OUT = 0.18;

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
  /**
   * Letter-by-letter mode: the wrong letter that was just turned away and the
   * blank it was aimed at. It shows there in red, shaking, until the parent
   * clears it a moment later; `nonce` makes the same wrong letter, typed again,
   * play again.
   */
  rejection?: { word: number; letter: number; char: string; nonce: number } | null;
  /** Letter-by-letter mode: the graded word whose letters are shown for a moment because the learner asked for help. */
  peekWord?: number | null;
  /** Every letter is in: the cursor bar has nothing left to point at. */
  finished?: boolean;
}

interface CursorBarRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The uniform scale an element is drawn at: its `scale` property (Tailwind's
 * `scale-*` utilities set that, not `transform`) times whatever its `transform`
 * matrix scales by. 1 when it has neither.
 */
function scaleOf(style: CSSStyleDeclaration): number {
  let scale = 1;
  const individual = parseFloat(style.scale);
  if (Number.isFinite(individual) && individual > 0) scale *= individual;
  if (style.transform && style.transform !== "none") {
    try {
      scale *= new DOMMatrixReadOnly(style.transform).a || 1;
    } catch {
      // An unparsable transform is treated as none.
    }
  }
  return scale;
}

/** The transitioned properties that move or resize a blank line (a word that grows on hover). */
const GEOMETRY_PROPERTIES = new Set(["transform", "scale", "translate", "rotate"]);

/** A running scale transition is never trusted for longer than this: a transition removed with its element would otherwise keep the tracking loop alive. */
const FOLLOW_LIMIT_MS = 1200;

/**
 * Where the cursor bar goes: exactly onto the line of the blank the learner is
 * on — same left and right ends, same thickness, same height — so the bar and
 * the blank read as one line that turns blue, never as two lines.
 *
 * The line is measured, not guessed, in screen space. A word the pointer is
 * over (or that is being spoken) grows by 4.5% and its blank line moves and
 * widens with it, so the measurement is repeated on every frame while any
 * transform or scale transition is running (and once more when it ends); `following`
 * is true meanwhile, and the bar then jumps to each new measurement instead of
 * gliding after it. Without this the bar stayed where the line had been
 * before the word grew, a double line for as long as the word was hovered and
 * after it.
 *
 * The drawn line is the blank's track minus 0.08em each side (at least 0.3em
 * wide), see Slot; the freeform caret (blanks off) has no drawn line and uses
 * the whole track.
 */
function useCursorBar(containerRef: RefObject<HTMLDivElement | null>, deps: readonly unknown[]) {
  const [bar, setBar] = useState<{ rect: CursorBarRect | null; following: boolean }>({
    rect: null,
    following: false,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frame = 0;
    let running = 0;
    let followingSince = 0;

    function measure() {
      const containerEl = containerRef.current;
      const track = containerEl?.querySelector<HTMLElement>('[data-current-tick="true"]');
      const following = running > 0;
      if (!containerEl || !track) {
        setBar((previous) =>
          previous.rect === null && previous.following === following
            ? previous
            : { rect: null, following },
        );
        return;
      }
      const box = containerEl.getBoundingClientRect();
      const trackBox = track.getBoundingClientRect();
      const word = track.closest<HTMLElement>("[data-dictation-word]");
      const scale = word ? scaleOf(getComputedStyle(word)) : 1;
      const em = (parseFloat(getComputedStyle(track).fontSize) || 0) * scale;
      const drawn = track.childElementCount > 0;
      const width = drawn
        ? Math.min(trackBox.width, Math.max(trackBox.width - 0.16 * em, 0.3 * em))
        : trackBox.width;
      const rect: CursorBarRect = {
        x: trackBox.left - box.left + (trackBox.width - width) / 2,
        y: trackBox.top - box.top,
        width,
        height: trackBox.height,
      };
      setBar((previous) => {
        const before = previous.rect;
        const same =
          before !== null &&
          previous.following === following &&
          Math.abs(before.x - rect.x) < 0.01 &&
          Math.abs(before.y - rect.y) < 0.01 &&
          Math.abs(before.width - rect.width) < 0.01 &&
          Math.abs(before.height - rect.height) < 0.01;
        return same ? previous : { rect, following };
      });
    }

    function loop() {
      if (running > 0 && performance.now() - followingSince > FOLLOW_LIMIT_MS) running = 0;
      measure();
      frame = running > 0 ? requestAnimationFrame(loop) : 0;
    }

    function transformStarted(event: Event) {
      if (!GEOMETRY_PROPERTIES.has((event as TransitionEvent).propertyName)) return;
      if (running === 0) followingSince = performance.now();
      running += 1;
      if (!frame) frame = requestAnimationFrame(loop);
    }

    function transformEnded(event: Event) {
      if (!GEOMETRY_PROPERTIES.has((event as TransitionEvent).propertyName)) return;
      running = Math.max(0, running - 1);
      measure();
    }

    measure();
    container.addEventListener("transitionrun", transformStarted);
    container.addEventListener("transitionend", transformEnded);
    container.addEventListener("transitioncancel", transformEnded);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    window.addEventListener("resize", measure);
    document.fonts?.ready?.then(measure).catch(() => {});

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("transitionrun", transformStarted);
      container.removeEventListener("transitionend", transformEnded);
      container.removeEventListener("transitioncancel", transformEnded);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return bar;
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
  rejection = null,
  peekWord = null,
  finished = false,
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

  const bar = useCursorBar(containerRef, [
    view.cursor?.word,
    view.cursor?.letter,
    value,
    showBlanks,
    finished,
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
                  current={
                    !finished &&
                    view.cursor?.word === cell.word &&
                    view.cursor.letter === cell.letter
                  }
                  showBlank={showBlanks}
                  lit={lit}
                  pulse={lit && Boolean(words?.litPulse)}
                  phase={phase}
                  reducedMotion={reducedMotion}
                  peeking={peekWord === cell.word}
                  rejection={
                    rejection && rejection.word === cell.word && rejection.letter === cell.letter
                      ? rejection
                      : null
                  }
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
              data-dictation-word=""
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
              <TickTrack current={!finished} />
              {rejection && (
                <RejectedLetter
                  key={rejection.nonce}
                  char={rejection.char}
                  reducedMotion={reducedMotion}
                />
              )}
            </span>
          </>
        )}
      </div>

      {/* The cursor: the current blank's own line, turned on. Same ends, same
          thickness and height as the line it sits on (see useCursorBar), which
          is hidden meanwhile (Slot), so there is only ever one line there. */}
      <motion.div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 left-0 rounded-full transition-colors duration-150",
          rejection ? "bg-[var(--lesson-letter-wrong)]" : "bg-[var(--lesson-underline)]",
        )}
        initial={false}
        animate={
          bar.rect && !finished
            ? {
                x: bar.rect.x,
                y: bar.rect.y,
                width: bar.rect.width,
                height: bar.rect.height,
                opacity: 1,
              }
            : { opacity: 0 }
        }
        transition={
          reducedMotion || bar.following
            ? { duration: 0 }
            : { type: "tween", duration: 0.16, ease: "easeOut" }
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

/**
 * The wrong letter the learner just typed, drawn in red over the blank it was
 * aimed at and shaking, exactly what the normal typing view does for a wrong
 * key. It shows what was TYPED, never the real letter. A space or other
 * blank-looking key draws nothing (the red cursor bar carries the message).
 */
function RejectedLetter({ char, reducedMotion }: { char: string; reducedMotion: boolean }) {
  if (char.trim() === "") return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <motion.span
        initial={{ x: 0 }}
        animate={reducedMotion ? { x: 0 } : { x: [0, -5, 5, -3, 3, 0] }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="text-[var(--lesson-letter-wrong)]"
      >
        {char}
      </motion.span>
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
 * The one deliberate exception is a peek: in letter-by-letter mode the learner
 * can ask for help and see the word they are on for a few seconds (`reveal`
 * below), which paints the real letters of the slots nobody has typed in yet.
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
function useSlotGlyph(typed: string | null, real: string, intro: boolean, peek: boolean) {
  const [memory, setMemory] = useState<{ letter: string; gone: boolean } | null>(null);
  if (typed !== null && (memory === null || memory.gone || memory.letter !== typed)) {
    setMemory({ letter: typed, gone: false });
  }
  // A peek that ends has to fade out before the real letter may be hidden, so
  // for that moment (`peekFading`) it is still painted. Only an untyped slot
  // can be peeking or fading: the learner's own letter takes over at once.
  const peekWanted = peek && typed === null;
  const [peekShown, setPeekShown] = useState(false);
  const [peekFading, setPeekFading] = useState(false);
  if (peekWanted !== peekShown) {
    setPeekShown(peekWanted);
    setPeekFading(!peekWanted && peekShown && typed === null);
  } else if (typed !== null && peekFading) {
    setPeekFading(false);
  }
  const leaving = typed === null && memory !== null && !memory.gone ? memory.letter : null;
  const showsReal = typed === null && leaving === null;
  const revealsReal =
    (intro && memory === null) || ((peekWanted || peekFading) && (memory === null || memory.gone));

  return {
    char: typed ?? leaving ?? real,
    revealsReal,
    concealed: showsReal && !revealsReal,
    /** The peek has ended and this slot's letter is fading out. */
    peekFading,
    /** The erased letter has faded out. */
    settle: () =>
      setMemory((current) => (current && !current.gone ? { ...current, gone: true } : current)),
    /** The ended peek's letter has faded out. */
    endPeekFade: () => setPeekFading(false),
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
  peeking,
  rejection,
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
  /** The learner asked for help on this slot's word: show its real letter (unless they have typed here). */
  peeking: boolean;
  /** A wrong letter was just turned away at this very slot. */
  rejection: { char: string; nonce: number } | null;
}) {
  const filled = cell.typed !== null;
  const glyph = useSlotGlyph(cell.typed, cell.char, phase === "intro", peeking);
  // Show the word: this slot's letter comes in (peekingIn) and, once the peek
  // is over, floats away (peekingOut) instead of vanishing at once.
  const peekingIn = peeking && !filled;
  const peekingOut = !peeking && glyph.peekFading && !filled;

  const introDelay = Math.min(order * INTRO_STEP, INTRO_MAX_DELAY);
  const glyphDelay = glyph.revealsReal && phase === "intro" ? introDelay : 0;
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
        be painted (only ever while the intro dissolves it, or a peek).
      */}
      <motion.span
        aria-hidden="true"
        data-ch={glyph.char}
        // The first frame of the intro is the real sentence; every other
        // slot starts hidden so a new sentence never flashes its text.
        initial={reducedMotion ? false : phase === "intro" || filled ? GLYPH_SHOWN : GLYPH_HIDDEN}
        animate={filled || peekingIn ? GLYPH_SHOWN : peekingOut ? GLYPH_PEEK_OUT : GLYPH_HIDDEN}
        onAnimationComplete={() => {
          if (filled) return;
          glyph.settle();
          if (!peeking) glyph.endPeekFade();
        }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : peekingIn
              ? {
                  // A springy rise with a little overshoot, each letter a beat
                  // after the one before; opacity and focus settle on their own
                  // (a spring would overshoot them into nonsense).
                  default: {
                    type: "spring",
                    stiffness: 420,
                    damping: 21,
                    mass: 0.7,
                    delay: Math.min(cell.letter * PEEK_STAGGER_IN, PEEK_MAX_STAGGER_IN),
                  },
                  opacity: {
                    duration: 0.2,
                    delay: Math.min(cell.letter * PEEK_STAGGER_IN, PEEK_MAX_STAGGER_IN),
                  },
                  filter: {
                    duration: 0.32,
                    ease: easeOut,
                    delay: Math.min(cell.letter * PEEK_STAGGER_IN, PEEK_MAX_STAGGER_IN),
                  },
                }
              : peekingOut
                ? {
                    duration: 0.34,
                    ease: [0.4, 0, 0.7, 1],
                    delay: Math.min(cell.letter * PEEK_STAGGER_OUT, PEEK_MAX_STAGGER_OUT),
                  }
                : { duration: filled ? 0.18 : 0.22, delay: glyphDelay, ease: easeOut }
        }
        className={cn(
          "inline-block transition-colors duration-150 before:content-[attr(data-ch)]",
          filled
            ? "text-[var(--lesson-letter-correct)]"
            : peekingIn || peekingOut
              ? // Lit: the primary colour with a soft halo that comes and goes with the letter.
                "text-[var(--lesson-primary)] [text-shadow:0_0_0.45em_color-mix(in_oklch,var(--lesson-primary)_50%,transparent)]"
              : "text-[var(--lesson-letter-pending)]",
          glyph.concealed && "invisible",
        )}
      />
      {rejection && (
        <RejectedLetter key={rejection.nonce} char={rejection.char} reducedMotion={reducedMotion} />
      )}
      {showBlank && (
        <TickTrack current={current}>
          <motion.span
            initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
            animate={
              filled
                ? { scaleX: 0.4, opacity: 0 }
                : current
                  ? // The cursor bar is drawn exactly over this line (useCursorBar):
                    // the line steps aside so that is the only line here.
                    { scaleX: 1, opacity: 0 }
                  : { scaleX: 1, opacity: 1 }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: filled || current ? 0.12 : 0.2, delay: tickDelay, ease: easeOut }
            }
            className={cn(
              "block h-full w-[max(calc(100%-0.16em),0.3em)] rounded-full bg-[var(--lesson-letter-pending)] transition-colors duration-200 group-hover/word:bg-[var(--lesson-primary)]",
              (lit || peekingIn || peekingOut) && "bg-[var(--lesson-primary)]",
              // A CSS animation outranks the inline opacity framer-motion sets, so
              // a pulsing word would bring back the lines that are meant to be
              // hidden: those under typed letters, and the current blank's own,
              // which the cursor bar stands in for.
              pulse && !filled && !current && "animate-pulse",
            )}
          />
        </TickTrack>
      )}
    </span>
  );
}
