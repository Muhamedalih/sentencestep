"use client";

import { useRef, type MouseEvent, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Rabbit, Snail, Turtle } from "lucide-react";

import {
  PRONUNCIATION_SPEED_STEPS,
  usePronunciationSettings,
} from "@/components/providers/pronunciation-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SPEED_ICONS = [Rabbit, Turtle, Snail];

/**
 * Directional icon transition: moving from Normal → Slow → Very slow reads
 * as "slowing down" (new icon rises in from below, old one drifts up and
 * out); wrapping Very slow → Normal reverses that same motion so it reads
 * as "speeding back up" rather than replaying the same slow-down cue.
 */
const iconVariants: Variants = {
  enter: (goingSlower: boolean) => ({ opacity: 0, y: goingSlower ? 6 : -6, scale: 0.75 }),
  center: { opacity: 1, y: 0, scale: 1 },
  exit: (goingSlower: boolean) => ({ opacity: 0, y: goingSlower ? -6 : 6, scale: 0.75 }),
};

/**
 * Cycles spoken-pronunciation playback speed (Normal → Slow → Very slow →
 * Normal — see PronunciationSettingsProvider, which also immediately
 * replays the current sentence/word at the new speed on every change).
 * Applies to pronunciation audio only; never touches typing speed,
 * animations, or sound effects. The selection persists for the rest of the
 * learning session (shared context state, not local to this button or the
 * current sentence).
 */
export function PronunciationSpeedControl({
  inputRef,
  className,
}: {
  /** The active typing input — clicking this button (a real `<button>`) would otherwise move DOM focus here, forcing the learner to click the sentence again to keep typing. Refocusing right after the click closes that gap, same pattern as PronunciationButton. */
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const { isActive, speedIndex, cycleSpeed } = usePronunciationSettings();
  const { dir, t } = useLocale();
  // Tracks the previous render's index (mutated directly during render, not
  // in an effect, specifically so the comparison below sees "before this
  // change" — the same latest-value-in-a-ref idiom used elsewhere in this
  // feature) to tell the icon transition which direction to animate in.
  const prevIndexRef = useRef(speedIndex);
  const goingSlower = speedIndex === prevIndexRef.current || speedIndex > prevIndexRef.current;
  prevIndexRef.current = speedIndex;

  if (!isActive) return null;

  // speedIndex only ever comes from the provider's modulo cycling, so it's
  // always in range — the fallbacks here just satisfy noUncheckedIndexedAccess.
  const step = PRONUNCIATION_SPEED_STEPS[speedIndex] ?? PRONUNCIATION_SPEED_STEPS[0];
  const SPEED_LABELS = [
    t.pronunciation.normalSpeed,
    t.pronunciation.slow,
    t.pronunciation.verySlow,
  ];
  const speedLabel = SPEED_LABELS[speedIndex] ?? t.pronunciation.normalSpeed;
  const Icon = SPEED_ICONS[speedIndex] ?? Rabbit;
  const level = 3 - speedIndex; // Normal=3, Slow=2, Very slow=1 — "more lit dots = faster"

  // Prevents the browser's native "move focus to the clicked button" default
  // action before it happens (that default runs on mousedown, ahead of the
  // click handler below) — so focus never leaves the typing input in the
  // first place, instead of racing a deferred refocus against it afterward.
  function handleMouseDown(event: MouseEvent) {
    event.preventDefault();
  }

  function handleClick() {
    cycleSpeed();
    // Synchronous, not deferred: with the native focus-steal already
    // prevented above, there's no race left to wait out. Still safe to call
    // even when focus never left the input at all.
    inputRef?.current?.focus();
  }

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      aria-label={t.pronunciation.speedButtonLabel
        .replace("{label}", speedLabel)
        .replace("{level}", String(level))}
      title={speedLabel}
      className={cn(
        "group border-border/60 bg-background/85 flex items-center gap-2.5 rounded-lg border py-1.5 pr-3.5 pl-1.5 shadow-sm backdrop-blur-md",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:border-border hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97]",
        className,
      )}
    >
      <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--lesson-secondary)]">
        <AnimatePresence mode="popLayout" initial={false} custom={goingSlower}>
          <motion.span
            key={step.key}
            custom={goingSlower}
            variants={reducedMotion ? undefined : iconVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transitions.snappy}
            className="flex items-center justify-center"
          >
            <Icon className="size-4.5 text-[var(--lesson-icon)]" aria-hidden="true" />
          </motion.span>
        </AnimatePresence>
      </span>

      <span className="flex flex-col items-start gap-1">
        <span dir={dir} className="text-foreground text-xs leading-none font-semibold">
          {speedLabel}
        </span>
        <span className="flex items-center gap-0.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className={cn(
                "size-1 rounded-full transition-colors duration-200",
                dot < level ? "bg-[var(--lesson-icon)]" : "bg-border",
              )}
            />
          ))}
        </span>
      </span>
    </button>
  );
}
