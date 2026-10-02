"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";

import { applyHint, planHint } from "@/lib/word-hint";
import {
  longestAnswerLength,
  matchAnswer,
  mayStillBeTypingLonger,
  type AnswerMatch,
} from "@/lib/word-lists-answer";
import { MAX_TYPE_AHEAD, appendedChars, type TypeAheadBuffer } from "@/lib/word-typing";

export type WordAttemptStatus = "pending" | "correct" | "incorrect";

/**
 * What a hint is doing to the answer right now, for the stage to draw (see
 * StageLetter). A hint is a repair in two beats: the letters that are wrong
 * crumble away, then the right letter is restored in their place.
 */
export interface HintRepair {
  /** How many of the typed letters are right and stay where they are. */
  keep: number;
  /** crumble: every typed letter from `keep` on is wrong and is going. restore: they are gone and the right letter is coming back in. */
  phase: "crumble" | "restore";
}

/** How long the two beats of a hint's repair take. Both 0 skips the animation (reduced motion). */
export interface HintTiming {
  crumbleMs: number;
  restoreMs: number;
}

const DEFAULT_HINT_TIMING: HintTiming = { crumbleMs: 500, restoreMs: 500 };

/** Extra characters allowed past the target's own length — generous enough for any realistic wrong guess, just a sanity cap on the native input. */
const MAX_EXTRA_CHARS = 8;

/** How a word ended, beyond right or wrong — only reported by the upgraded ("smart") practice. */
export interface WordResultDetail {
  /** The learner typed an accepted alternate (a British spelling, a synonym) instead of the stored word. */
  alternate?: string;
  /** The learner pressed "I don't know" instead of typing a wrong answer. */
  gaveUp?: boolean;
}

interface UseWordTypingEngineOptions {
  /** The single word being learned. */
  target: string;
  /** Changing this resets the engine — pass the word's id/targetWord, not e.g. an index. */
  resetKey: string;
  /**
   * Fires once this word's attempt is settled — `true` the instant the
   * buffer exactly matches `target` (no Enter required), `false` once the
   * learner presses Enter on anything that doesn't (or gives up). Fired from a
   * timeout (see correctDelayMs/incorrectDelayMs) so the final visual state is
   * fully played out first — or sooner, when the screen skips the wait (see
   * `skip`, and typing ahead below).
   */
  onResult: (correct: boolean, detail?: WordResultDetail) => void;
  /** Delay before onResult(true) fires, so the settled green state is visible before advancing. */
  correctDelayMs?: number;
  /**
   * Delay before onResult(false) fires — deliberately much longer than
   * correctDelayMs by default: it has to cover the wrong attempt's own
   * green/red diff AND the correct-answer reveal animation that plays
   * after it (see VocabularySentence's DIFF_VISIBLE_MS/REVEAL_LETTER_MS),
   * not just a quick color flash.
   */
  incorrectDelayMs?: number;
  /** Same rationale as useTypingEngine's identical option — an externally owned, stable ref for a parent's replay button to refocus after a click. */
  inputRef?: RefObject<HTMLInputElement | null>;

  /**
   * Switches on the upgraded behaviour below ("Smart word practice"): accepted
   * alternates, typing ahead, and the hint / give-up / skip controls. Left off
   * (the default), the engine is exactly what it always was — an exact, case-
   * insensitive match of `target`, and every key typed while a word settles is
   * dropped.
   */
  smart?: boolean;
  /**
   * Extra answers that are also right (a British spelling, a synonym that fits).
   * Typing one settles the word as correct and reports it in the result detail.
   */
  alternates?: readonly string[];
  /** How long a right answer typed with an alternate stays up (long enough to read "also correct") before moving on. */
  alternateDelayMs?: number;
  /** Delay before onResult(false) after "I don't know": shorter than incorrectDelayMs, because there is no wrong attempt's diff to show first. Defaults to incorrectDelayMs. */
  giveUpDelayMs?: number;
  /**
   * Where letters typed while a RIGHT answer settles go instead of being
   * dropped: the next word picks them up when it starts. The first letter typed
   * ahead also ends the wait on the spot — a learner who is already typing the
   * next word is plainly ready for it.
   */
  typeAhead?: TypeAheadBuffer;
  /** How long the two beats of a hint's repair take. */
  hintTiming?: HintTiming;
  /** A hint has taken effect: the right letter is going in. The screen counts the cost (a star) here, not when the button is pressed. */
  onHint?: () => void;
}

const noop = () => {};

/**
 * Word Lists' typing engine — deliberately NOT useTypingEngine. Every other
 * lesson mode rejects a wrong keystroke outright (it never enters the
 * buffer), which is the right feel for "copy what you see." Word Lists is a
 * recall exercise instead: the learner produces the word from memory, so a
 * wrong guess has to actually land on screen to be graded, not vanish
 * before it's felt. Letters accumulate freely here; grading happens either
 * automatically (an exact match) or on Enter (anything else), never per
 * keystroke.
 *
 * With `smart` on it also lets the learner ask for a hint (`hint`: the next
 * right letter, mending anything wrong before it — see planHint), say "I don't
 * know" (`giveUp`), end a settled word's wait early (`skip`), and keeps what they
 * type while a right answer settles (or while a hint is being drawn).
 */
export function useWordTypingEngine({
  target,
  resetKey,
  onResult,
  correctDelayMs = 550,
  incorrectDelayMs = 550,
  inputRef: externalInputRef,
  smart = false,
  alternates,
  alternateDelayMs = 1600,
  giveUpDelayMs,
  typeAhead,
  hintTiming = DEFAULT_HINT_TIMING,
  onHint,
}: UseWordTypingEngineOptions) {
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<WordAttemptStatus>("pending");
  /** What the learner typed when it matched an alternate, for the "also correct" note. */
  const [alternate, setAlternate] = useState<string | null>(null);
  /** Which letters of the answer a hint put there (positions), so the stage can show them as given. */
  const [given, setGiven] = useState<readonly number[]>([]);
  /** A hint is being drawn (null otherwise). */
  const [repair, setRepair] = useState<HintRepair | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Guards against a second grading firing while the current one's timeout
  // is still pending (e.g. a stray keystroke or Enter after the buffer's
  // already settled) — mirrors useTypingEngine's completedRef.
  const settledRef = useRef(false);
  const settledAsRef = useRef<"correct" | "incorrect" | null>(null);
  // The latest typed text, readable from event handlers without waiting for a render.
  const typedRef = useRef("");
  // Runs the pending result right now (and cancels its timer): what `skip` and typing ahead call.
  const finishRef = useRef<() => void>(noop);
  // Always the latest callbacks, so a timer that fires later never calls a stale closure.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  // The carry-over is taken once per word, even if React runs the reset effect twice (Strict Mode in development).
  const carriedRef = useRef<{ key: string; value: string } | null>(null);
  // A hint is being drawn: typing is held back (not lost) until it is done.
  const repairingRef = useRef(false);
  const repairTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const heldWhileRepairingRef = useRef("");
  const onHintRef = useRef(onHint);
  onHintRef.current = onHint;

  const maxLength =
    (smart ? longestAnswerLength(target, alternates) : target.length) + MAX_EXTRA_CHARS;

  const setTypedValue = useCallback((value: string) => {
    typedRef.current = value;
    setTyped(value);
  }, []);

  /** Stops a hint that is being drawn and forgets what was held back for it. */
  const clearRepair = useCallback(() => {
    repairTimersRef.current.forEach(clearTimeout);
    repairTimersRef.current = [];
    repairingRef.current = false;
    heldWhileRepairingRef.current = "";
    setRepair(null);
  }, []);

  const matchTyped = useCallback(
    (value: string): AnswerMatch | null => {
      if (smart) return matchAnswer(value, target, alternates);
      return value.length > 0 && value.toLowerCase() === target.toLowerCase()
        ? { kind: "exact" }
        : null;
    },
    [smart, target, alternates],
  );

  const settleCorrect = useCallback(
    (match: AnswerMatch, value: string) => {
      settledRef.current = true;
      settledAsRef.current = "correct";
      setStatus("correct");
      const matchedAlternate = match.kind === "alternate" ? value.trim() : null;
      setAlternate(matchedAlternate);
      const detail: WordResultDetail | undefined = matchedAlternate
        ? { alternate: matchedAlternate }
        : undefined;
      const finish = () => {
        clearTimeout(resultTimeoutRef.current);
        finishRef.current = noop;
        onResultRef.current(true, detail);
      };
      finishRef.current = finish;
      resultTimeoutRef.current = setTimeout(
        finish,
        matchedAlternate ? alternateDelayMs : correctDelayMs,
      );
    },
    [alternateDelayMs, correctDelayMs],
  );

  const settleIncorrect = useCallback(
    (didGiveUp: boolean) => {
      settledRef.current = true;
      settledAsRef.current = "incorrect";
      setStatus("incorrect");
      setGaveUp(didGiveUp);
      const finish = () => {
        clearTimeout(resultTimeoutRef.current);
        finishRef.current = noop;
        onResultRef.current(false, didGiveUp ? { gaveUp: true } : undefined);
        // Self-heal rather than relying solely on the caller's resetKey
        // changing: a caller whose queue narrows to exactly this one
        // outstanding word (see WordReviewSession) requeues it right back to
        // the front, so `target`/`resetKey` end up identical to what they
        // already were — the [resetKey] effect below never re-fires, and
        // without this, settledRef would stay true forever, silently
        // swallowing every further keystroke.
        setTypedValue("");
        setStatus("pending");
        setGaveUp(false);
        setAlternate(null);
        setGiven([]);
        settledRef.current = false;
        settledAsRef.current = null;
      };
      finishRef.current = finish;
      resultTimeoutRef.current = setTimeout(
        finish,
        didGiveUp ? (giveUpDelayMs ?? incorrectDelayMs) : incorrectDelayMs,
      );
    },
    [incorrectDelayMs, giveUpDelayMs, setTypedValue],
  );

  useEffect(() => {
    clearTimeout(resultTimeoutRef.current);
    finishRef.current = noop;
    settledRef.current = false;
    settledAsRef.current = null;
    setStatus("pending");
    setAlternate(null);
    setGaveUp(false);
    setGiven([]);
    clearRepair();

    // Letters typed while the previous word settled arrive here. Taken once
    // per word: Strict Mode runs this effect twice in development, and the
    // second run must see the same letters, not an empty buffer.
    if (!smart || !typeAhead) {
      carriedRef.current = null;
    } else if (carriedRef.current?.key !== resetKey) {
      carriedRef.current = { key: resetKey, value: typeAhead.take() };
    }
    const carried = (carriedRef.current?.value ?? "").slice(0, maxLength);
    setTypedValue(carried);
    inputRef.current?.focus();

    // The learner may already have typed the whole word during the transition.
    if (carried) {
      const match = matchTyped(carried);
      if (match && !mayStillBeTypingLonger(carried, target, alternates)) {
        settleCorrect(match, carried);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the word changes, never because a callback or option changed identity
  }, [resetKey, inputRef]);

  useEffect(() => {
    return () => {
      clearTimeout(resultTimeoutRef.current);
      repairTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const incoming = event.target.value;
      if (settledRef.current) {
        // A right answer is settling and the learner has carried on typing:
        // keep those letters for the next word, and move on at once.
        if (smart && typeAhead && settledAsRef.current === "correct") {
          const extra = appendedChars(typedRef.current, incoming);
          if (extra) {
            typeAhead.hold(extra);
            finishRef.current();
          }
        }
        return;
      }
      if (repairingRef.current) {
        // A hint is mending the answer: what the learner types meanwhile is
        // kept and goes in after it, never lost.
        const extra = appendedChars(typedRef.current, incoming);
        if (extra) {
          heldWhileRepairingRef.current = (heldWhileRepairingRef.current + extra).slice(
            0,
            MAX_TYPE_AHEAD,
          );
        }
        return;
      }
      const value = incoming.slice(0, maxLength);
      setTypedValue(value);
      // Letters a hint put in are only "given" while they are still there.
      setGiven((previous) =>
        previous.some((index) => index >= value.length)
          ? previous.filter((index) => index < value.length)
          : previous,
      );

      const match = matchTyped(value);
      if (match && !(smart && mayStillBeTypingLonger(value, target, alternates))) {
        settleCorrect(match, value);
      }
    },
    [smart, typeAhead, maxLength, matchTyped, target, alternates, setTypedValue, settleCorrect],
  );

  const submit = useCallback(() => {
    if (settledRef.current || repairingRef.current || typedRef.current.length === 0) return;
    const value = typedRef.current;
    // An exact match is normally settled by handleChange the instant it happens.
    // It can only get here when a longer accepted answer was still possible
    // ("colo" on the way to "colour"), or never — so check before calling it wrong.
    const match = matchTyped(value);
    if (match) {
      settleCorrect(match, value);
      return;
    }
    settleIncorrect(false);
  }, [matchTyped, settleCorrect, settleIncorrect]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      submit();
    },
    [submit],
  );

  const handlePaste = useCallback((event: ClipboardEvent<HTMLInputElement>) => {
    // Recall is the point — block pasting the answer in wholesale.
    event.preventDefault();
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  /**
   * A hint: the NEXT right letter, however far the learner has got. Right
   * letters stay, anything typed after the first wrong one is taken away, and the
   * right letter goes in (see planHint) — drawn as a repair in two beats, about a
   * second in all (HintTiming): the wrong letters crumble, the right one is
   * restored. What the learner types meanwhile is held and added afterwards. As
   * often as they like; the screen counts the cost through `onHint`. Returns
   * whether a hint was started (false when the word has settled, a hint is
   * already being drawn, or there is nothing left to give).
   */
  const hint = useCallback((): boolean => {
    if (!smart || settledRef.current || repairingRef.current) return false;
    const plan = planHint(typedRef.current, target, alternates);
    if (!plan) return false;
    const result = applyHint(typedRef.current, plan);

    const apply = () => {
      setTypedValue(result);
      setGiven((previous) => [
        ...previous.filter((index) => index < plan.keep),
        ...(plan.add ? [plan.keep] : []),
      ]);
      onHintRef.current?.();
    };
    const finish = () => {
      repairTimersRef.current = [];
      repairingRef.current = false;
      setRepair(null);
      let value = typedRef.current;
      const held = heldWhileRepairingRef.current;
      heldWhileRepairingRef.current = "";
      if (held) {
        value = (value + held).slice(0, maxLength);
        setTypedValue(value);
      }
      inputRef.current?.focus();
      // The letter that went in (or what was typed meanwhile) may complete the word.
      const match = matchTyped(value);
      if (match && !mayStillBeTypingLonger(value, target, alternates)) settleCorrect(match, value);
    };

    repairingRef.current = true;
    heldWhileRepairingRef.current = "";
    inputRef.current?.focus();
    if (hintTiming.crumbleMs <= 0 && hintTiming.restoreMs <= 0) {
      apply();
      finish();
      return true;
    }
    setRepair({ keep: plan.keep, phase: "crumble" });
    repairTimersRef.current = [
      setTimeout(() => {
        setRepair({ keep: plan.keep, phase: "restore" });
        apply();
      }, hintTiming.crumbleMs),
      setTimeout(finish, hintTiming.crumbleMs + hintTiming.restoreMs),
    ];
    return true;
  }, [
    smart,
    target,
    alternates,
    hintTiming.crumbleMs,
    hintTiming.restoreMs,
    maxLength,
    inputRef,
    matchTyped,
    settleCorrect,
    setTypedValue,
  ]);

  /** "I don't know": the word is treated as missed and its right spelling is shown. Returns whether it took effect. */
  const giveUp = useCallback((): boolean => {
    if (!smart || settledRef.current) return false;
    clearRepair();
    settleIncorrect(true);
    // Enter (to move on once the right spelling has shown) must reach the answer field, not the button.
    inputRef.current?.focus();
    return true;
  }, [smart, clearRepair, settleIncorrect, inputRef]);

  /** Ends the current wait now — the missed-word screen once the right spelling has been shown, or a right answer's "also correct" note. */
  const skip = useCallback(() => {
    if (!settledRef.current) return;
    finishRef.current();
  }, []);

  return {
    typed,
    status,
    alternate,
    given,
    repair,
    gaveUp,
    inputRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    focus,
    hint,
    giveUp,
    skip,
  };
}
