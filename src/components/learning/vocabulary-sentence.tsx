"use client";

import { SharedInput } from "@/components/learning/shared-input";
import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CornerDownLeft } from "lucide-react";

import { StageLetter } from "@/components/learning/stage-letter";
import type { StageLetterState } from "@/components/learning/stage-letter";
import { useLocale } from "@/components/providers/locale-provider";
import { useWordTypingEngine } from "@/hooks/use-word-typing-engine";
import type { WordAttemptStatus, WordResultDetail } from "@/hooks/use-word-typing-engine";
import { easeOut } from "@/lib/motion";
import {
  GLYPH_HIDDEN,
  GLYPH_PEEK_OUT,
  GLYPH_SHOWN,
  PEEK_LIT_CLASS,
  peekInTotalMs,
  peekInTransition,
  peekOutTotalMs,
  peekOutTransition,
} from "@/lib/peek-glyph";
import { cn } from "@/lib/utils";
import { SMART_TIMING } from "@/lib/word-mastery/smart";
import type { SmartTiming } from "@/lib/word-mastery/smart";
import type { TypeAheadBuffer } from "@/lib/word-typing";
import { BLANK_TOKEN } from "@/types/word-lists";

/** How long the wrong attempt's green/red diff stays on screen before it clears and the correct spelling reveals itself. */
const DIFF_VISIBLE_MS = 900;
/** How long the correct spelling stays fully on screen once its letters have risen in — long enough to actually read it and say it, before it floats away. */
const REVEAL_HOLD_MS = 2000;
/** Pause after the correct word has dissolved, before advancing to the next word. */
const REVEAL_TAIL_MS = 250;
/** Settle time for a correct (auto-matched) attempt — just long enough for the green flash to register before advancing. */
const CORRECT_DELAY_MS = 550;

/** The typing stage's natural size range — unchanged from before the word-length cap was added below. */
const STAGE_MIN_REM = 3.5;
const STAGE_MAX_REM = 8.4;
/** Word Lists' practice screens show the stage, the sentence and the meaning 20% larger than this component's own default (see `enlarged`). */
const ENLARGE = 1.2;
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
function stageFontSize(word: string, enlarged: boolean): string {
  const lengthCapRem = STAGE_CONTAINER_REM / (word.length * STAGE_AVG_CHAR_EM);
  const scale = enlarged ? ENLARGE : 1;
  // The length cap is a hard limit of the container, so it is never scaled: a long
  // word still fits its line, only the words that had room to grow do.
  const maxRem = Math.max(Math.min(STAGE_MAX_REM * scale, lengthCapRem), STAGE_MIN_REM);
  const minRem = Math.min(STAGE_MIN_REM * scale, maxRem);
  return `clamp(${minRem}rem, ${1.68 * scale}rem + ${7 * scale}vw, ${maxRem}rem)`;
}

/** What the screen can ask of a sentence from outside (the help bar's two buttons). */
export interface WordSentenceControls {
  /** A hint: the next right letter, mending anything wrong before it. As often as the learner likes, one at a time. False when there was nothing to give. */
  hint: () => boolean;
  /** "I don't know": counts as a miss and shows the right spelling. */
  giveUp: () => void;
}

/**
 * The upgrades of "Smart word practice" (see src/lib/word-mastery/smart.ts).
 * Passing this object switches them all on; leaving it out gives the sentence
 * exactly as it always was.
 */
export interface SmartSentenceOptions {
  /** Other answers that are also right (British spellings, synonyms). */
  alternates?: readonly string[];
  /** Where letters typed while a right answer settles are kept for the next word. */
  typeAhead?: TypeAheadBuffer;
  /** The screen's help bar drives the hint and "I don't know" through this. */
  controlsRef?: RefObject<WordSentenceControls | null>;
  /** The word's state as it changes: pending, correct or incorrect. */
  onStatusChange?: (status: WordAttemptStatus) => void;
  /** A hint has taken effect (the right letter is going in): the screen counts its cost, a star, here. */
  onHint?: () => void;
  /** A hint is being drawn (true) or has finished (false): the help bar waits for it before offering the next one. */
  onHintBusyChange?: (busy: boolean) => void;
  /** The pauses; defaults to SMART_TIMING. */
  timing?: SmartTiming;
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
 *
 * With `smart` the same screen also: keeps the letters typed while a word
 * settles (no dead zone), lets Enter skip the missed-word screen once the right
 * spelling has been shown, accepts alternates and says "also correct", takes
 * hints (the next right letter, with anything wrong before it crumbling away and
 * the right one restored in its place) and "I don't know" from the help bar, and
 * never shifts the layout when the first letter is typed (the stage holds its
 * place as an empty line: no slots or dashes are drawn, the letters simply appear).
 */
export function VocabularySentence({
  sentence,
  targetWord,
  onResult,
  inputRef,
  fontFamily,
  smart,
  enlarged = false,
  inline = false,
}: {
  sentence: string;
  targetWord: string;
  /** Fires once this word's attempt settles — see useWordTypingEngine.onResult. */
  onResult: (correct: boolean, detail?: WordResultDetail) => void;
  /** Owned by the parent (VocabularyPractice) — see useWordTypingEngine's inputRef option for why. */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Admin -> Fonts' Word Lists override (see resolveSectionFontFamily) — applied only to the big typing stage above, never the context sentence, which stays legible in the app's own default font. */
  fontFamily?: string;
  smart?: SmartSentenceOptions;
  /** Word Lists' practice screens: the typing stage and the sentence 20% larger. Everything else (the help bar's stars and buttons) keeps its size. */
  enlarged?: boolean;
  /** The redesigned screen: the learner types INTO the blank of the sentence (letters, the wrong attempt's diff and the right spelling all appear inside it) instead of on a big stage above it. Everything else — grading, hints, timing — is unchanged. */
  inline?: boolean;
}) {
  const { t, dir } = useLocale();
  const reducedMotion = useReducedMotion() ?? false;
  const [isFocused, setIsFocused] = useState(false);
  // The shared input is usually still focused when the next word appears, so no focus event will announce it.
  useEffect(() => {
    if (document.activeElement === engine.inputRef.current) setIsFocused(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mounted word
  }, []);
  // Where the correct-answer reveal is, once a wrong attempt's diff has had its
  // moment on screen — see the effect below. "hidden" covers the diff itself
  // and every word that wasn't missed. Resets for free on the next word (this
  // component remounts per word — see VocabularyPractice's key={word.id}).
  const [reveal, setReveal] = useState<"hidden" | "in" | "out">("hidden");
  // True once the right spelling has been fully shown after a miss: from then
  // on Enter (or the Continue button) may skip the rest of the wait.
  const [skipReady, setSkipReady] = useState(false);

  const timing = smart ? (smart.timing ?? SMART_TIMING) : null;
  const diffMs = timing ? timing.diffVisibleMs : DIFF_VISIBLE_MS;
  const holdMs = timing ? timing.revealHoldMs : REVEAL_HOLD_MS;
  const tailMs = timing ? timing.revealTailMs : REVEAL_TAIL_MS;
  const correctDelayMs = timing ? timing.correctDelayMs : CORRECT_DELAY_MS;
  // The pop of a right answer: the upgraded screen lets it breathe.
  const popS = timing ? timing.correctPopMs / 1000 : 0.2;

  // Same rise-in / dissolve-out Dictation's Show the word uses (see
  // peek-glyph.ts), so a missed word is shown the same way everywhere. Reduced
  // motion drops the movement but keeps the hold: that part is reading time.
  const revealInMs = reducedMotion ? 0 : peekInTotalMs(targetWord.length);
  const revealOutMs = reducedMotion ? 0 : peekOutTotalMs(targetWord.length);

  // A wrong submission needs enough time on screen for the diff, the letters
  // rising in, the word holding still for the hold time and the letters
  // dissolving again before this word is done and the session moves on — a
  // plain fixed delay would either cut the reveal off mid-animation or, for a
  // short word, sit around doing nothing. "I don't know" has no diff to show.
  const revealTailTotalMs = revealInMs + holdMs + revealOutMs + tailMs;
  const incorrectDelayMs = diffMs + revealTailTotalMs;

  const smartRef = useRef(smart);
  smartRef.current = smart;
  // Reduced motion skips the animation of a hint's repair: the letter just changes.
  const hintTiming =
    timing === null
      ? null
      : reducedMotion
        ? { crumbleMs: 0, restoreMs: 0 }
        : { crumbleMs: timing.hintCrumbleMs, restoreMs: timing.hintRestoreMs };

  const engine = useWordTypingEngine({
    target: targetWord,
    resetKey: targetWord,
    onResult,
    correctDelayMs,
    incorrectDelayMs,
    giveUpDelayMs: revealTailTotalMs,
    inputRef,
    smart: smart !== undefined,
    alternates: smart?.alternates,
    alternateDelayMs: timing?.alternateDelayMs,
    typeAhead: smart?.typeAhead,
    hintTiming: hintTiming ?? undefined,
    onHint: () => smartRef.current?.onHint?.(),
  });

  // Drives the diff -> reveal handoff: as soon as a wrong attempt settles,
  // let its green/red diff sit for the diff time, then raise the correct
  // spelling, hold it, and let it float away. `engine.status` only ever
  // transitions into "incorrect" once per word (useWordTypingEngine's
  // settledRef locks it), so this never double-fires or restarts mid-reveal.
  // "I don't know" has no diff: the spelling rises at once.
  useEffect(() => {
    if (engine.status !== "incorrect") {
      setReveal("hidden");
      setSkipReady(false);
      return;
    }
    const lead = engine.gaveUp ? 0 : diffMs;
    const raise = setTimeout(() => setReveal("in"), lead);
    const ready = setTimeout(() => setSkipReady(true), lead + revealInMs);
    const dissolve = setTimeout(() => setReveal("out"), lead + revealInMs + holdMs);
    return () => {
      clearTimeout(raise);
      clearTimeout(ready);
      clearTimeout(dissolve);
    };
  }, [engine.status, engine.gaveUp, revealInMs, diffMs, holdMs]);

  const isRevealPhase = engine.status === "incorrect" && (engine.gaveUp || reveal !== "hidden");
  const isDiffPhase = engine.status === "incorrect" && !isRevealPhase;

  // Tell the screen what is happening, to keep its help bar in step: the word's
  // state as it changes, and whether a hint is being drawn.
  useEffect(() => {
    smartRef.current?.onStatusChange?.(engine.status);
  }, [engine.status]);
  const hintBusy = engine.repair !== null;
  useEffect(() => {
    smartRef.current?.onHintBusyChange?.(hintBusy);
  }, [hintBusy]);

  // The help bar's buttons reach the engine from outside.
  const { hint: takeHint, giveUp: giveUpWord } = engine;
  useImperativeHandle(
    smart?.controlsRef,
    () => ({
      hint: () => takeHint(),
      giveUp: () => {
        giveUpWord();
      },
    }),
    [takeHint, giveUpWord],
  );

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

  // The upgraded stage is always on screen (an empty line until the first letter
  // is typed) so nothing above or below it jumps.
  const showStage = inline ? false : smart ? true : engine.typed.length > 0 || isRevealPhase;

  // While a hint mends the answer the word loses letters and is centred again:
  // remember how wide it was while the wrong ones still stood, and once they are
  // gone glide from where the centred word was to where it is now, instead of
  // letting it jump by half the width of what crumbled.
  const stageWordRef = useRef<HTMLSpanElement>(null);
  const widthBeforeRepairRef = useRef(0);
  useLayoutEffect(() => {
    if (engine.repair?.phase === "crumble" && stageWordRef.current) {
      widthBeforeRepairRef.current = stageWordRef.current.offsetWidth;
    }
  });
  useLayoutEffect(() => {
    const word = stageWordRef.current;
    if (engine.repair?.phase !== "restore" || !word || reducedMotion) return;
    const shift = (widthBeforeRepairRef.current - word.offsetWidth) / 2;
    if (Math.abs(shift) < 1) return;
    word.animate([{ transform: `translateX(${-shift}px)` }, { transform: "translateX(0)" }], {
      duration: 300,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    });
  }, [engine.repair?.phase, reducedMotion]);
  // The typed letters of the upgraded stage, one by one, so a hint can mend
  // them: every letter after the last right one crumbles (the last typed goes
  // first), and the right letter is restored where the first of them stood.
  const typedChars = useMemo(() => Array.from(engine.typed), [engine.typed]);
  const repair = engine.repair;
  const crumbleCount =
    repair?.phase === "crumble" ? Math.max(0, typedChars.length - repair.keep) : 0;
  const stageLetters = typedChars.map((char, index) => {
    let letterState: StageLetterState = "rest";
    if (repair?.phase === "crumble" && index >= repair.keep) letterState = "crumble";
    else if (repair?.phase === "restore" && index === repair.keep && engine.given.includes(index))
      letterState = "restore";
    return (
      <StageLetter
        key={index}
        char={char}
        state={letterState}
        given={engine.status === "pending" && engine.given.includes(index)}
        crumbleOrder={typedChars.length - 1 - index}
        crumbleCount={crumbleCount}
        crumbleMs={timing?.hintCrumbleMs ?? 0}
        restoreMs={timing?.hintRestoreMs ?? 0}
      />
    );
  });

  // What the learner is producing, drawn by whichever surface shows it: the big stage above the
  // sentence, or (inline) the blank inside it. A wrong attempt's diff, the right spelling rising in
  // after a miss, and the typed letters (which a hint can mend) are the same in both.
  const stageContent =
    isDiffPhase && diff ? (
      diff.map((letter, index) => (
        <span key={index} className={letter.correct ? "text-success" : "text-danger"}>
          {letter.char}
        </span>
      ))
    ) : isRevealPhase ? (
      targetWord.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={reducedMotion ? false : GLYPH_HIDDEN}
          animate={reveal === "out" ? GLYPH_PEEK_OUT : GLYPH_SHOWN}
          transition={
            reducedMotion
              ? { duration: 0 }
              : reveal === "out"
                ? peekOutTransition(index)
                : peekInTransition(index)
          }
          className={cn("inline-block whitespace-pre", PEEK_LIT_CLASS)}
        >
          {char}
        </motion.span>
      ))
    ) : smart && engine.typed.length === 0 ? (
      // Nothing is drawn until the first letter is typed (no slots, no dashes),
      // but the stage keeps its line height so the sentence below never jumps
      // when that letter arrives.
      <span aria-hidden="true" className="invisible">
        {"\u00A0"}
      </span>
    ) : (
      <span
        ref={stageWordRef}
        // Only the upgraded stage needs a box (its letters move on their own);
        // the original one stays plain inline text, as it always was.
        className={cn(
          smart && "inline-block",
          engine.status === "correct" ? "text-success" : "text-foreground",
        )}
      >
        {smart ? stageLetters : engine.typed}
      </span>
    );

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
          transition={{ duration: isDiffPhase ? 0.35 : popS }}
          style={{
            fontSize: stageFontSize(targetWord, enlarged),
            ...(fontFamily ? { fontFamily } : undefined),
          }}
          className={cn(
            "leading-none font-extrabold tracking-tight whitespace-nowrap",
            isDiffPhase && "decoration-danger line-through decoration-[0.07em]",
          )}
        >
          {stageContent}
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
        className={cn(
          "text-muted-foreground w-full text-center leading-tight font-semibold text-balance",
          enlarged
            ? // Back to the regular size while the keyboard is open, so the sentence, Check and the help bar all fit above it.
              "text-[clamp(1.68rem,1.2rem+2.16vw,2.7rem)] [html[data-keyboard]_&]:text-[clamp(1.4rem,1rem+1.8vw,2.25rem)]"
            : "text-[clamp(1.4rem,1rem+1.8vw,2.25rem)]",
        )}
      >
        {prefix && <span>{prefix} </span>}
        <motion.span
          className="relative inline-block cursor-text align-baseline"
          // The wrong attempt's shake, which the big stage does for itself, happens to the blank.
          animate={inline && !reducedMotion && isDiffPhase ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <BlankBox
            length={inline ? Math.max(targetWord.length, engine.typed.length) : targetWord.length}
            active={isFocused && engine.status === "pending"}
            revealedWord={engine.status === "correct" ? (engine.alternate ?? targetWord) : null}
            popS={popS}
            tone={inline ? (isDiffPhase ? "diff" : isRevealPhase ? "reveal" : "typing") : undefined}
          >
            {inline &&
            engine.status !== "correct" &&
            (isDiffPhase || isRevealPhase || engine.typed.length > 0) ? (
              <span
                style={fontFamily ? { fontFamily } : undefined}
                className={cn(
                  "pointer-events-none absolute inset-0 flex items-center justify-center leading-none font-extrabold tracking-tight whitespace-nowrap",
                  isDiffPhase && "decoration-danger line-through decoration-[0.07em]",
                )}
              >
                {stageContent}
              </span>
            ) : null}
          </BlankBox>
          <SharedInput
            inputRef={engine.inputRef}
            value={engine.typed}
            onChange={engine.handleChange}
            onKeyDown={(event) => {
              // Once the word has settled Enter means "next": it ends a right
              // answer's wait at once, and skips a missed word's screen — but only
              // after the right spelling has been shown, so a double-tap on Enter
              // can never skip a word the learner has not even seen.
              if (smart && engine.status !== "pending" && event.key === "Enter") {
                event.preventDefault();
                if (engine.status === "correct" || skipReady) engine.skip();
                return;
              }
              engine.handleKeyDown(event);
            }}
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
            enterKeyHint="done"
            aria-label={t.typing.typeMissingWord}
          />
        </motion.span>
        {suffix && <span> {suffix}</span>}
      </p>

      {smart ? (
        // One line for every note, with a fixed height: the Enter hint, the
        // "also correct" message and the Continue button take turns here, so the
        // rows below (the help bar) never move.
        <div className="flex min-h-9 items-center justify-center" dir={dir}>
          {engine.status === "correct" && engine.alternate ? (
            <p role="status" className="text-success text-sm font-semibold">
              {t.wordLists.smart.alsoCorrect.replace("{word}", targetWord)}
            </p>
          ) : engine.status === "incorrect" && skipReady ? (
            <motion.button
              type="button"
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: easeOut }}
              // The input keeps focus, so Enter (the other way to continue) still works.
              onMouseDown={(event) => event.preventDefault()}
              onClick={engine.skip}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus-visible:ring-2"
            >
              {t.wordLists.smart.continueEnter}
              <CornerDownLeft className="size-4" aria-hidden="true" />
            </motion.button>
          ) : engine.status === "pending" && engine.typed.length > 0 ? (
            <CheckHint
              hint={t.wordLists.pressEnterToCheck}
              label={t.wordLists.checkAnswer}
              onCheck={engine.submit}
            />
          ) : null}
        </div>
      ) : (
        engine.status === "pending" &&
        engine.typed.length > 0 && (
          <CheckHint
            hint={t.wordLists.pressEnterToCheck}
            label={t.wordLists.checkAnswer}
            onCheck={engine.submit}
          />
        )
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
/** "Press Enter to check" on a keyboard; on a touch screen, which has no Enter key to speak of, a Check button. */
function CheckHint({ hint, label, onCheck }: { hint: string; label: string; onCheck: () => void }) {
  return (
    <>
      <p className="text-muted-foreground text-xs font-medium pointer-coarse:hidden">{hint}</p>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onCheck}
        className="hidden h-12 items-center justify-center rounded-xl bg-[var(--lesson-secondary)] px-8 text-base font-semibold text-[var(--lesson-icon)] transition-transform outline-none active:scale-95 pointer-coarse:inline-flex"
      >
        {label}
      </button>
    </>
  );
}

function BlankBox({
  length,
  active,
  revealedWord,
  popS,
  tone,
  children,
}: {
  length: number;
  active: boolean;
  revealedWord?: string | null;
  /** How long the word takes to pop into the sentence once it is right, in seconds. */
  popS: number;
  /** Inline typing only: what the letters inside the box are showing — the learner's own typing, a wrong attempt's diff, or the right spelling after a miss. Colors the box's border to match. */
  tone?: "typing" | "diff" | "reveal";
  /** Inline typing only: what is drawn inside the box. */
  children?: ReactNode;
}) {
  if (revealedWord) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: popS, ease: easeOut }}
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
        // Letters inside the box: it is a filled box from the first one, and a wrong attempt
        // or the right spelling after a miss colors it.
        tone === "typing" &&
          children &&
          "border-solid border-[var(--lesson-underline)] bg-[var(--lesson-underline)]/[0.06]",
        tone === "diff" && "border-danger/50 bg-danger/[0.06] border-solid",
        tone === "reveal" && "border-success/50 bg-success/[0.08] border-solid",
      )}
    >
      {children}
    </span>
  );
}
