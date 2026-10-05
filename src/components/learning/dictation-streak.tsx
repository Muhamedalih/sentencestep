"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** steady: counting; risk: the learner's pointer is on Show the word, which would end it; broke: it has just ended. */
export type StreakMode = "steady" | "risk" | "broke";

interface DictationStreakProps {
  /** Sentences in a row finished without Show the word. */
  count: number;
  mode: StreakMode;
  label: string;
  riskLabel: string;
  brokenLabel: string;
  ariaLabel: string;
  /** Just the spark and the number (Conversation bubbles have no room for the caption). */
  compact?: boolean;
}

/** How quickly the number runs down to zero when the streak breaks. */
const COUNTDOWN_STEP_MS = 90;

/**
 * The streak chip: a small pill in the lesson's top corner counting the
 * sentences in a row finished without Show the word. It earns its place
 * quietly (it only appears from the second sentence and a new one makes the
 * number rise), and it is the long-range reason not to press the button: when
 * the learner's pointer reaches Show the word the caption warns that it would
 * end the streak, and pressing it does — the pill shakes, goes grey and counts
 * down to nothing.
 */
export function DictationStreak({
  count,
  mode,
  label,
  riskLabel,
  brokenLabel,
  ariaLabel,
  compact = false,
}: DictationStreakProps) {
  const [shown, setShown] = useState(count);

  useEffect(() => {
    if (mode !== "broke") {
      setShown(count);
      return;
    }
    const timer = setInterval(() => {
      setShown((current) => {
        if (current <= 1) clearInterval(timer);
        return Math.max(0, current - 1);
      });
    }, COUNTDOWN_STEP_MS);
    return () => clearInterval(timer);
  }, [mode, count]);

  const caption = mode === "broke" ? brokenLabel : mode === "risk" ? riskLabel : label;

  return (
    <motion.div
      role="status"
      aria-label={ariaLabel}
      initial={{ opacity: 0, scale: 0.8, y: -6 }}
      animate={
        mode === "broke"
          ? { opacity: 1, scale: 1, y: 0, x: [0, -5, 5, -3, 3, 0] }
          : { opacity: 1, scale: 1, y: 0, x: 0 }
      }
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full py-1 ps-2.5 pe-3 text-sm font-semibold ring-1 transition-colors duration-300",
        mode === "broke"
          ? "bg-muted text-muted-foreground ring-border"
          : mode === "risk"
            ? "bg-accent/15 text-accent ring-accent ring-2"
            : "bg-accent/15 text-accent ring-accent/35",
      )}
    >
      <Sparkles className="size-4 shrink-0" aria-hidden="true" />
      <motion.b
        key={shown}
        initial={{ y: 7, opacity: 0, scale: 1.35 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className="inline-block min-w-[0.7em] text-center text-base tabular-nums"
      >
        {shown}
      </motion.b>
      {!compact && <span className="whitespace-nowrap">{caption}</span>}
    </motion.div>
  );
}
