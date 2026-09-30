"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * The primary "Continue" button of a feedback screen (Dictation, From
 * memory). It is the one thing the learner should do next, so it moves: it
 * springs in when the correction appears, a soft ring keeps pulsing off it,
 * the arrow nudges forward, and it grows on hover / squashes on press.
 * Everything collapses to a plain static button for learners who prefer
 * reduced motion.
 */
export function ContinueButton({ onClick, children, className }: ActionButtonProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduced ? false : { opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.05 }}
      whileHover={reduced ? undefined : { scale: 1.06 }}
      whileTap={reduced ? undefined : { scale: 0.93 }}
      className={cn(
        buttonVariants({ size: "lg" }),
        // transition-colors: the base button transitions every property, which would smooth
        // (and lag) framer-motion's per-frame transform updates.
        "bg-primary text-primary-foreground relative gap-2 shadow-md transition-colors hover:opacity-100",
        className,
      )}
    >
      {!reduced && (
        <motion.span
          aria-hidden="true"
          className="ring-primary/60 pointer-events-none absolute inset-0 rounded-xl ring-2"
          animate={{ scale: [1, 1.14, 1.14], opacity: [0.7, 0, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", repeatDelay: 0.4 }}
        />
      )}
      <span className="relative">{children}</span>
      <motion.span
        aria-hidden="true"
        className="relative inline-flex"
        animate={reduced ? undefined : { x: [0, 5, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowRight className="size-5" />
      </motion.span>
    </motion.button>
  );
}

/** The secondary "Try again" button next to Continue: same entrance and press feel, and the icon spins back on hover. */
export function RetryButton({ onClick, children, className }: ActionButtonProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduced ? false : { opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.14 }}
      whileHover={reduced ? undefined : "hover"}
      whileTap={reduced ? undefined : { scale: 0.93 }}
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "hover:border-primary/60 gap-2 transition-colors",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        className="inline-flex"
        variants={{ hover: { rotate: -360, transition: { duration: 0.5, ease: "easeInOut" } } }}
      >
        <RotateCcw className="size-5" />
      </motion.span>
      {children}
    </motion.button>
  );
}
