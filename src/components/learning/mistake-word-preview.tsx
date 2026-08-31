"use client";

import { motion } from "framer-motion";

import { easeOut } from "@/lib/motion";

/**
 * "Fix Your Mistakes"' letter-by-letter reveal (w → we → wen → went) before
 * the learner starts typing — a small, self-contained stagger built from
 * the same easing curve the rest of the app already uses (see lib/motion.ts),
 * not a new animation framework. Each letter pops in with a short
 * fade+rise+scale, staggered ~90ms apart after an initial ~150ms beat —
 * fast enough to feel like one continuous reveal, slow enough to actually
 * read each letter arriving. Purely visual: the caller (FixYourMistakesSession)
 * owns the timing of what happens after the reveal finishes (the ~1s hold,
 * then the transition into typing) and of the pronunciation, neither of
 * which this component knows anything about.
 */
export function MistakeWordPreview({
  word,
  reducedMotion,
}: {
  word: string;
  reducedMotion: boolean;
}) {
  return (
    <div dir="ltr" className="flex items-center justify-center gap-[0.03em] py-4">
      {word.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.24,
            ease: easeOut,
            delay: reducedMotion ? 0 : 0.15 + index * 0.09,
          }}
          className="text-foreground inline-block text-[clamp(2.5rem,1.6rem+3.6vw,4.75rem)] font-bold tracking-tight"
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
}

/** Matches MistakeWordPreview's own stagger timing above — the caller uses this to know when the reveal has visually finished (before adding its own hold time). */
export function mistakeRevealDurationMs(word: string): number {
  return 150 + word.length * 90 + 240;
}
