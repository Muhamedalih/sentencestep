"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { useWordTypingEngine } from "@/hooks/use-word-typing-engine";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { BLANK_TOKEN } from "@/types/word-lists";

/** How long the wrong attempt's green/red diff stays on screen before it clears and the correct spelling reveals itself. */
const DIFF_VISIBLE_MS = 900;
/** Stagger between each letter of the correct-answer reveal — fast enough to read as one quick flourish, not a slow typewriter. */
const REVEAL_LETTER_MS = 65;
/** Pause after the correct word finishes revealing, before advancing to the next word. */
const REVEAL_TAIL_MS = 450;
/** Settle time for a correct (auto-matched) attempt — just long enough for the green flash to register before advancing. */
const CORRECT_DELAY_MS = 550;

/** The typing stage's natural size range — unchanged from before the word-length cap was added below. */
const STAGE_MIN_REM = 3.5;
const STAGE_MAX_REM = 8.4;
/** Rough average glyph width, in ems, for this stage's bold/extrabold weight — used only to keep a long word from overflowing its line (see stageFontSize). */
const STAGE_AVG_CHAR_EM = 0.62;
/** The stage's available width, in rem, once it's inside VocabularySentence's max-w-2xl container. */
const STAGE_CONTAINER_REM = 40;

/**
 * The typing stage is always one line (see `whitespace-nowrap` below) — for
 * most words that just means picking the same large, viewport-responsive
 * size every word used to render at. A handful of words in this content
 * (e.g. "accommodation") are long enough that STAGE_MAX_REM would run them
 * past the container's edge, so the max end of the clamp additionally
 * shrinks to whatever size actually lets this specific word's full length
 * fit — never below STAGE_MIN_REM, and never above STAGE_MAX_REM for
 * everything short enough not to need it.
 */
function stageFontSize(word: string): string {
  const lengthCapRem = STAGE_CONTAINER_REM / (word.length * STAGE_AVG_CHAR_EM);
  const maxRem = Math.max(Math.min(STAGE_MAX_REM, lengthCapRem), STAGE_MIN_REM);
  return `clamp(${STAGE_MIN_REM}rem, 1.68rem + 7vw, ${maxRem}rem)`;
}

/**
 * The core Word Lists interaction: a context sentence with exactly one
 * blank, rendered as a plain empty box (never the letters themselves —
 * that's the whole point of a recall exercise) plus a big letter-by-letter
 * "typing stage" above it that shows what the learner is producing.
 *
 * Grading is Enter-to-submit, not per-keystroke: a wrong guess is a real,
 * visible attempt (green for every letter that lands in the right spot, red
 * for every letter that doesn't, struck through as a whole once submitted),
 * not a keystroke silently rejected before it ever reaches the screen. An
 * exact match settles instantly, no Enter needed — see useWordTypingEngine.
 * A wrong attempt then clears and the correct spelling types itself out
 * letter by letter, so the learner always leaves a mistake having actually
 * seen the right answer, not just a red flash.
 */
export function VocabularySentence({
  sentence,
  targetWord,
  onResult,
  inputRef,
  fontFamily,
}: {
  sentence: string;
  targetWord: string;
  /** Fires once this word's attempt settles — see useWordTypingEngine.onResult. */
  onResult: (correct: boolean) => void;
  /** Owned by the parent (VocabularyPractice) — see useWordTypingEngine's inputRef option for why. */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Admin -> Fonts' Word Lists override (see resolveSectionFontFamily) — applied only to the big typing stage above, never the context sentence, which stays legible in the app's own default font. */
  fontFamily?: string;
}) {
  const { t } = useLocale();
  const reducedMotion = useReducedMotion() ?? false;
  const [isFocused, setIsFocused] = useState(false);
  // How many letters of the CORRECT word have been auto-revealed so far,
  // once a wrong attempt's diff has had its moment on screen — see the
  // effect below. Both reset for free on the next word (this component
  // remounts per word — see VocabularyPractice's key={word.id}).
  const [revealCount, setRevealCount] = useState(0);
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // A wrong submission needs enough time on screen for BOTH the diff (see
  // DIFF_VISIBLE_MS) and the letter-by-letter correct-answer reveal that
  // follows it (see the effect below) before this word is done and the
  // session moves on — a plain fixed delay would either cut the reveal off
  // mid-animation or, for a short word, sit around doing nothing.
  const incorrectDelayMs = DIFF_VISIBLE_MS + targetWord.length * REVEAL_LETTER_MS + REVEAL_TAIL_MS;

  const engine = useWordTypingEngine({
    target: targetWord,
    resetKey: targetWord,
    onResult,
    correctDelayMs: CORRECT_DELAY_MS,
    incorrectDelayMs,
    inputRef,
  });

  // Drives the diff -> reveal handoff: as soon as a wrong attempt settles,
  // let its green/red diff sit for DIFF_VISIBLE_MS, then start ticking
  // revealCount up once per REVEAL_LETTER_MS so the correct spelling types
  // itself out. `engine.status` only ever transitions into "incorrect" once
  // per word (useWordTypingEngine's settledRef locks it), so this never
  // double-fires or restarts mid-reveal.
  useEffect(() => {
    if (engine.status !== "incorrect") {
      setRevealCount(0);
      return;
    }
    const startReveal = setTimeout(() => {
      let count = 0;
      revealIntervalRef.current = setInterval(() => {
        count += 1;
        setRevealCount(count);
        if (count >= targetWord.length) clearInterval(revealIntervalRef.current);
      }, REVEAL_LETTER_MS);
    }, DIFF_VISIBLE_MS);
    return () => {
      clearTimeout(startReveal);
      clearInterval(revealIntervalRef.current);
    };
  }, [engine.status, targetWord]);

  const isRevealPhase = engine.status === "incorrect" && revealCount > 0;
  const isDiffPhase = engine.status === "incorrect" && !isRevealPhase;

  const [prefix, suffix] = useMemo(() => {
    const parts = sentence.split(BLANK_TOKEN);
    return [parts[0]?.trim() ?? "", parts[1]?.trim() ?? ""];
  }, [sentence]);

  // Only meaningful during the diff phase — comparing the learner's own
  // typed characters against targetWord position-by-position, so a
  // right-letter-wrong-answer (like "tawin" against "twins") shows exactly
  // which of THEIR letters landed, not the answer relabeled. A position past
  // the end of what they typed (they submitted short) falls back to
  // target's own letter, still marked wrong — there's nothing of theirs to
  // show there.
  const diff = useMemo(() => {
    if (!isDiffPhase) return null;
    const length = Math.max(targetWord.length, engine.typed.length);
    return Array.from({ length }, (_, index) => {
      const typedChar = engine.typed[index];
      const targetChar = targetWord[index];
      if (typedChar === undefined) return { char: targetChar ?? "", correct: false };
      return {
        char: typedChar,
        correct: targetChar !== undefined && typedChar.toLowerCase() === targetChar.toLowerCase(),
      };
    });
  }, [isDiffPhase, engine.typed, targetWord]);

  const showStage = engine.typed.length > 0 || isRevealPhase;

  return (
    <div dir="ltr" className="flex flex-col items-center gap-5">
      {showStage && (
        <motion.div
          key={engine.status === "pending" ? "typing" : engine.status}
          animate={
            !reducedMotion && isDiffPhase
              ? { x: [0, -4, 4, -3, 3, 0] }
              : { x: 0, scale: engine.status === "correct" && !reducedMotion ? [0.96, 1] : 1 }
          }
          transition={{ duration: isDiffPhase ? 0.35 : 0.2 }}
          style={{
            fontSize: stageFontSize(targetWord),
            ...(fontFamily ? { fontFamily } : undefined),
          }}
          className={cn(
            "leading-none font-extrabold tracking-tight whitespace-nowrap",
            isDiffPhase && "decoration-danger line-through decoration-[0.07em]",
          )}
        >
          {isDiffPhase && diff ? (
            diff.map((letter, index) => (
              <span key={index} className={letter.correct ? "text-success" : "text-danger"}>
                {letter.char}
              </span>
            ))
          ) : isRevealPhase ? (
            targetWord.split("").map((char, index) => (
              <motion.span
                key={index}
                initial={false}
                animate={
                  reducedMotion
                    ? { opacity: index < revealCount ? 1 : 0 }
                    : { opacity: index < revealCount ? 1 : 0, scale: index < revealCount ? 1 : 0.5 }
                }
                transition={{ duration: 0.15, ease: easeOut }}
                className="text-success inline-block"
              >
                {char}
              </motion.span>
            ))
          ) : (
            <span className={engine.status === "correct" ? "text-success" : "text-foreground"}>
              {engine.typed}
            </span>
          )}
        </motion.div>
      )}

      {/* Plain inline text flow, deliberately not flex: the blank has to
          wrap exactly like a word inside this sentence (staying right after
          whatever text precedes it, and flowing onto a new line with the
          rest of the text once it runs out of room). A flex row wraps whole
          FLEX ITEMS to a new line, not text within them — with prefix as one
          long flex item that itself wraps across two lines, the blank (a
          separate sibling item) had nowhere to sit but its own new line
          below the entire sentence, nowhere near the word it belongs after. */}
      <p
        onClick={engine.focus}
        className="text-muted-foreground w-full text-center text-[clamp(1.4rem,1rem+1.8vw,2.25rem)] leading-tight font-semibold text-balance"
      >
        {prefix && <span>{prefix} </span>}
        <span className="relative inline-block cursor-text align-baseline">
          <BlankBox
            length={targetWord.length}
            active={isFocused && engine.status === "pending"}
            revealedWord={engine.status === "correct" ? targetWord : null}
          />
          <input
            ref={engine.inputRef}
            value={engine.typed}
            onChange={engine.handleChange}
            onKeyDown={engine.handleKeyDown}
            onPaste={engine.handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="absolute inset-0 h-full w-full cursor-text opacity-0"
            dir="ltr"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={t.typing.typeMissingWord}
          />
        </span>
        {suffix && <span> {suffix}</span>}
      </p>

      {engine.status === "pending" && engine.typed.length > 0 && (
        <p className="text-muted-foreground text-xs font-medium">{t.wordLists.pressEnterToCheck}</p>
      )}
    </div>
  );
}

/**
 * The blank itself — an empty box standing in for the hidden word, not a
 * per-letter tick like every other typing surface in this app: this word
 * genuinely isn't visible anywhere until the learner produces it (see the
 * giant stage above), so the gap needs to read as "a whole word is missing
 * here," not "a few characters." A soft tinted panel with a dashed border,
 * not a diagonal hatch pattern — a plain, roomy void reads calmer than a
 * crossed-out-box look. Focused (`active`) swaps the dashed border for a
 * solid one plus a soft outer glow, echoing the same underline-color cue
 * every other typing surface in this app uses for "this is where you're
 * typing," without needing a visible caret in an input the box is only
 * standing in for.
 *
 * Once the word is actually typed correctly, `revealedWord` swaps the box
 * out for the real word itself, right there in the sentence — so the
 * completed sentence reads whole afterward instead of leaving a permanent
 * gap where a word obviously used to be missing.
 */
function BlankBox({
  length,
  active,
  revealedWord,
}: {
  length: number;
  active: boolean;
  revealedWord?: string | null;
}) {
  if (revealedWord) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: easeOut }}
        className="text-success mx-1 inline-block align-baseline"
      >
        {revealedWord}
      </motion.span>
    );
  }

  const style: CSSProperties = {
    width: `${Math.max(length, 3) * 0.85}em`,
    height: "1.65em",
    ...(active
      ? ({
          "--lesson-underline-glow":
            "color-mix(in oklch, var(--lesson-underline) 14%, transparent)",
        } as CSSProperties)
      : undefined),
  };

  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "bg-muted/60 border-muted-foreground/25 relative mx-1.5 inline-block translate-y-[0.32em] rounded-xl border-2 border-dashed align-baseline transition-all duration-200",
        active &&
          "border-solid border-[var(--lesson-underline)] bg-[var(--lesson-underline)]/[0.06] shadow-[0_0_0_5px_var(--lesson-underline-glow,transparent)]",
      )}
    />
  );
}
