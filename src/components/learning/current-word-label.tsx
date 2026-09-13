"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Shows only the single word the learner is currently typing, with its
 * support-language translation — never more than one word, never a history
 * of past words. Renders nothing if this sentence has no word-level
 * translation for the current locale yet, or the current index has none —
 * see Sentence.supportWordTranslations.
 *
 * A quiet caption, not a card: no border, fill, or background at all — the
 * English word set apart by weight/tracking/case (a small kicker label,
 * the same idiom a photo caption or eyebrow uses elsewhere on the site)
 * rather than by putting it in a box, with a thin rule underneath as the
 * one graphic touch. Colors stay muted greys throughout, never the purple
 * accent an earlier version tried and the user rejected as too loud for a
 * reading aid. Stays in one fixed spot above the sentence (wherever its
 * caller places it) as the current word changes underneath it, rather
 * than chasing that word's own on-screen position — an earlier version
 * tried exactly that and it read as distracting motion, not a steady aid.
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
      className="inline-flex flex-col gap-2"
    >
      <div className="flex items-baseline gap-3">
        <span className="text-[15px] font-bold tracking-[0.09em] text-[var(--lesson-title)]/75 uppercase">
          {word.en}
        </span>
        <span
          dir={dir}
          className="text-[15px] font-semibold tracking-wide text-[var(--lesson-subtitle)]"
        >
          {word.text}
        </span>
      </div>
      <span aria-hidden="true" className="h-px w-8 rounded-full bg-[var(--lesson-subtitle)]/35" />
    </motion.div>
  );
}
