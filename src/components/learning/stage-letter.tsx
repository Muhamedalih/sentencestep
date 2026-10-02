"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * One letter of the big typing stage in Word Lists, and the two beats of a
 * hint's repair (see useWordTypingEngine's `hint`):
 *
 *  - crumble: a letter that is wrong goes red, shudders, and falls away blurred,
 *    the last letter first, one after another;
 *  - restore: the right letter takes the place of the first one that went, pops
 *    in with a flare of the accent colour, and settles.
 *
 * Every other letter is plain text: ordinary typing is never animated.
 */
export type StageLetterState = "rest" | "crumble" | "restore";

/** Keyframe positions of the crumble: a short shudder, then the fall. */
const CRUMBLE_TIMES = [0, 0.1, 0.2, 0.3, 0.38, 1];
/** The longest a single letter takes to crumble, in seconds; the stagger between letters fits the rest of the beat. */
const CRUMBLE_LETTER_S = 0.36;

export function StageLetter({
  char,
  state,
  given,
  crumbleOrder = 0,
  crumbleCount = 1,
  crumbleMs,
  restoreMs,
}: {
  char: string;
  state: StageLetterState;
  /** A hint put this letter there: it shows in the accent colour while the word is still being typed. */
  given: boolean;
  /** crumble only: 0 for the letter that goes first (the last one typed), counting up towards the first wrong one. */
  crumbleOrder?: number;
  /** crumble only: how many letters are going. */
  crumbleCount?: number;
  /** The two beats of the repair, in milliseconds. */
  crumbleMs: number;
  restoreMs: number;
}) {
  if (state === "rest") {
    return (
      <span className={cn("inline-block whitespace-pre", given && "text-accent")}>{char}</span>
    );
  }

  if (state === "crumble") {
    const beatS = crumbleMs / 1000;
    const letterS = Math.min(CRUMBLE_LETTER_S, beatS);
    const stagger = crumbleCount > 1 ? Math.max(0, beatS - letterS) / (crumbleCount - 1) : 0;
    const tilt = crumbleOrder % 2 === 0 ? 14 : -14;
    return (
      <motion.span
        key="crumble"
        aria-hidden="true"
        initial={{
          x: "0em",
          y: "0em",
          scale: 1,
          rotate: 0,
          opacity: 1,
          filter: "blur(0px)",
        }}
        animate={{
          x: ["0em", "-0.04em", "0.04em", "-0.03em", "0em", "0em"],
          y: ["0em", "0em", "0em", "0em", "0em", "0.3em"],
          scale: [1, 1.06, 1.06, 1.06, 1, 0.5],
          rotate: [0, 0, 0, 0, 0, tilt],
          opacity: [1, 1, 1, 1, 1, 0],
          filter: ["blur(0px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(10px)"],
        }}
        transition={{
          duration: letterS,
          delay: crumbleOrder * stagger,
          times: CRUMBLE_TIMES,
          ease: ["linear", "linear", "linear", "linear", "easeIn"],
        }}
        className="text-danger inline-block whitespace-pre"
      >
        {char}
      </motion.span>
    );
  }

  const restoreS = restoreMs / 1000;
  return (
    <span className="relative inline-block whitespace-pre">
      <motion.span
        key="halo"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.85, 0], scale: [0.4, 1.35, 2] }}
        transition={{ duration: restoreS * 1.3, ease: "easeOut" }}
        className="pointer-events-none absolute inset-[-0.1em] z-0 rounded-full bg-[radial-gradient(closest-side,var(--color-accent),transparent)]"
      />
      <motion.span
        key="restore"
        initial={{ opacity: 0, scale: 0.35, y: "0.2em", filter: "blur(6px)" }}
        animate={{
          opacity: [0, 1, 1],
          scale: [0.35, 1.28, 1],
          y: ["0.2em", "-0.06em", "0em"],
          filter: ["blur(6px)", "blur(0px)", "blur(0px)"],
        }}
        transition={{ duration: restoreS, times: [0, 0.6, 1], ease: "easeOut" }}
        className="text-accent relative z-10 inline-block"
      >
        {char}
      </motion.span>
    </span>
  );
}
