"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Shows only the single word the learner is currently typing, with its
 * support-language translation — never more than one word, never a history
 * of past words. Renders nothing if this sentence has no word-level
 * translation for the current locale yet, or the current index has none —
 * see Sentence.supportWordTranslations.
 *
 * Plain inline text — deliberately no card, border, or background (unlike
 * CurrentWordCard, which this replaces in the typing screen specifically):
 * a quiet reading aid, not a piece of chrome. Stays in one fixed spot above
 * the sentence (wherever its caller places it) as the current word changes
 * underneath it, rather than chasing that word's own on-screen position —
 * an earlier version tried exactly that and it read as distracting motion,
 * not a steady aid.
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
export function CurrentWordLabel({
  word,
  dir,
}: {
  word: { en: string; text: string } | undefined;
  /** The active support locale's writing direction — RTL for Arabic, LTR for Spanish (see useLocale's `dir`). Never hardcoded here: this label renders whichever language the learner actually chose. */
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
      className="flex items-baseline gap-2.5"
    >
      <span className="text-2xl font-semibold text-[var(--lesson-title)]">{word.en}</span>
      <span className="text-xl text-[var(--lesson-subtitle)]/50" aria-hidden="true">
        –
      </span>
      <span dir={dir} className="text-2xl font-medium text-[var(--lesson-icon)]">
        {word.text}
      </span>
    </motion.div>
  );
}
