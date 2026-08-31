"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Shows only the single word the learner is currently typing, with its
 * support-language translation — never more than one word, never a history
 * of past words. Renders nothing if this sentence has no word-level
 * translation for the current locale yet, or the current index has none —
 * see Sentence.supportWordTranslations.
 *
 * Deliberately not wrapped in framer-motion's AnimatePresence: an earlier
 * version of this lesson screen used AnimatePresence for the sentence
 * itself and, combined with the layout-effect-driven typing indicator in
 * the same subtree, that reliably produced a stuck render (see
 * typing-sentence.tsx's history). A plain `key`-driven remount sidesteps
 * that whole class of bug — the outgoing word just disappears instantly
 * (imperceptible at typing speed) while the incoming word fades in via its
 * own `initial`→`animate` transition, with no coordinated exit to hang on.
 */
export function CurrentWordCard({
  word,
  dir,
}: {
  word: { en: string; text: string } | undefined;
  /** The active support locale's writing direction — RTL for Arabic, LTR for Spanish (see useLocale's `dir`). Never hardcoded here: this card renders whichever language the learner actually chose. */
  dir: "rtl" | "ltr";
}) {
  const reducedMotion = useReducedMotion() ?? false;

  if (!word) return null;

  return (
    <motion.div
      key={word.en}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="border-border/60 bg-card inline-flex flex-col gap-0.5 rounded-xl border px-3 py-2 shadow-lg shadow-black/20"
    >
      <span className="text-lg font-semibold text-[var(--lesson-title)]">{word.en}</span>
      <span className="text-base text-[var(--lesson-subtitle)]" dir={dir}>
        {word.text}
      </span>
    </motion.div>
  );
}
