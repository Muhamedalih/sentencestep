"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";

/**
 * The corner "expand" control's destination (see SavedSentenceCard) — blows
 * the sentence up to fill nearly the whole viewport over a blurred, dimmed
 * version of the page it was opened from, rather than a solid opaque modal.
 * Portaled to document.body so it always escapes the card's own stacking
 * context/overflow, regardless of where in the page it was opened from.
 */
export function SavedSentenceFocusOverlay({
  en,
  supportText,
  onClose,
}: {
  en: string;
  supportText?: string;
  onClose: () => void;
}) {
  const { dir } = useLocale();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      initial={reducedMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-6 backdrop-blur-2xl sm:p-12"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute end-4 top-4 flex size-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
        transition={
          reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 24 }
        }
        onClick={(event) => event.stopPropagation()}
        className="max-w-4xl text-center"
      >
        <p
          className="font-quote text-[clamp(1.75rem,1rem+4.5vw,4.25rem)] leading-[1.15] font-medium text-white"
          dir="ltr"
        >
          {en}
        </p>
        {supportText && (
          <p className="mt-6 text-lg text-white/55 sm:text-2xl" dir={dir}>
            {supportText}
          </p>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
