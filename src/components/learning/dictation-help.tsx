"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleHelp, Flag, Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";

interface DictationHelpProps {
  /** "Stuck on this letter?" — names the group for screen readers too. */
  prompt: string;
  /** Show the word. Absent where the word cannot be shown (blanks off), which leaves Give up alone. */
  onShowWord?: () => void;
  showWordLabel: string;
  showWordTitle: string;
  /** A word is on screen right now: showing it again would only cost another star. */
  showingWord: boolean;
  onGiveUp?: () => void;
  giveUpLabel: string;
  giveUpTitle: string;
  dir: "ltr" | "rtl";
}

/**
 * What letter-by-letter Dictation offers a learner who is stuck: Show the word
 * and Give up, in one tidy bar under the sentence. The bar springs up from
 * below as a single piece (the two actions are not separate floating buttons),
 * with the helpful action — a soft tint of the lesson colour that fills in on
 * hover — leading, and the way out beside it, quieter. On a phone the question
 * takes the first row and the two actions share the second, side by side.
 */
export function DictationHelp({
  prompt,
  onShowWord,
  showWordLabel,
  showWordTitle,
  showingWord,
  onGiveUp,
  giveUpLabel,
  giveUpTitle,
  dir,
}: DictationHelpProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      role="group"
      aria-label={prompt}
      dir={dir}
      initial={reduced ? false : { opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
      className="border-border/70 bg-card/90 inline-flex w-full max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border p-1.5 shadow-lg shadow-black/10 backdrop-blur-sm sm:w-auto sm:flex-nowrap"
    >
      <span className="text-muted-foreground flex w-full items-center justify-center gap-2 px-3 py-1 text-sm font-medium sm:w-auto sm:justify-start sm:py-0 sm:pe-2">
        <CircleHelp className="size-4 shrink-0 text-[var(--lesson-icon)]" aria-hidden="true" />
        {prompt}
      </span>
      <span aria-hidden="true" className="bg-border mx-1 hidden h-6 w-px sm:block" />
      {onShowWord && (
        <HelpAction
          onClick={onShowWord}
          title={showWordTitle}
          disabled={showingWord}
          tone="helpful"
          icon={<Lightbulb className="size-4" aria-hidden="true" />}
          reduced={reduced}
        >
          {showWordLabel}
        </HelpAction>
      )}
      {onGiveUp && (
        <HelpAction
          onClick={onGiveUp}
          title={giveUpTitle}
          tone="quiet"
          icon={<Flag className="size-4" aria-hidden="true" />}
          reduced={reduced}
        >
          {giveUpLabel}
        </HelpAction>
      )}
    </motion.div>
  );
}

function HelpAction({
  onClick,
  title,
  disabled = false,
  tone,
  icon,
  reduced,
  children,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  tone: "helpful" | "quiet";
  icon: ReactNode;
  reduced: boolean;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      whileHover={reduced || disabled ? undefined : { scale: 1.04 }}
      whileTap={reduced || disabled ? undefined : { scale: 0.95 }}
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:flex-none [&_svg]:shrink-0",
        // transition-colors only: the base `transition-all` would smooth (and
        // lag) framer-motion's per-frame scale on hover and press.
        "transition-colors duration-200",
        tone === "helpful"
          ? "bg-[var(--lesson-secondary)] text-[var(--lesson-icon)] ring-1 ring-[var(--lesson-primary)]/25 hover:bg-[var(--lesson-primary)] hover:text-white hover:ring-[var(--lesson-primary)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}
