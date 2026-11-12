"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { RatingFace, type FaceLevel } from "@/components/words/ladder/ladder-faces";
import { useLocale } from "@/components/providers/locale-provider";
import { submitAppRatingAction } from "@/lib/feedback/actions";
import { ROUNDS_RATING_LESSON_ID, WORDS_RATING_MODE } from "@/lib/feedback/rating-record";
import { getOrCreateAnonId } from "@/lib/feedback/rating-storage";
import { cn } from "@/lib/utils";
import { ladderStrings } from "@/lib/word-ladder/strings";

/** From the loved face (5 stars) to the hated one (1), the order they are drawn in. */
const LEVELS: readonly FaceLevel[] = [5, 4, 3, 2, 1];
const MAX_COMMENT_LENGTH = 2000;

/**
 * The rating card of the word rounds: five faces, the one under the pointer lights up and the others
 * lose their colour, and once a face is chosen an optional comment box and the send button open under
 * it. It is saved in the ratings table as a rating of the words section (mode "words", lesson id
 * "rounds"), so Admin > Ratings lists it on its own tab and the site's average never includes it.
 * "Not now" (and Escape, and a tap outside) close it without sending anything. The card is portalled
 * to the body: the finish page animates its children, and a transformed ancestor would pin the card's
 * `fixed` box to itself instead of the screen.
 */
export function LadderRatingModal({
  open,
  onRated,
  onSkip,
}: {
  open: boolean;
  /** The rating was sent. */
  onRated: () => void;
  /** "Not now": closed without a rating. */
  onSkip: () => void;
}) {
  const { locale } = useLocale();
  const copy = ladderStrings(locale).rating;
  const reducedMotion = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState<FaceLevel | 0>(0);
  const [chosen, setChosen] = useState<FaceLevel | 0>(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => setMounted(true), []);

  const lit = hover || chosen;

  const send = useCallback(() => {
    if (!chosen || sent) return;
    setSent(true);
    void submitAppRatingAction({
      rating: chosen,
      comment: comment.trim(),
      lessonId: ROUNDS_RATING_LESSON_ID,
      mode: WORDS_RATING_MODE,
      locale,
      anonId: getOrCreateAnonId(),
    }).catch(() => {});
    window.setTimeout(onRated, 1300);
  }, [chosen, comment, locale, onRated, sent]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !sent) onSkip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onSkip, sent]);

  if (!mounted || !open) return null;

  const placeholder =
    chosen >= 4
      ? copy.placeholderPositive
      : chosen === 3
        ? copy.placeholderNeutral
        : copy.placeholderNegative;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !sent) onSkip();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="border-border bg-card w-full max-w-[600px] rounded-2xl border p-6 shadow-2xl sm:p-8"
      >
        {sent ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
            <RatingFace level={(chosen || 4) as FaceLevel} className="size-20" />
            <p className="text-foreground text-2xl font-semibold" dir="auto">
              {copy.thanks}
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <span
                className="bg-foreground text-background rounded-md px-3 py-1 text-[13px] font-bold"
                dir="auto"
              >
                {copy.tag}
              </span>
            </div>
            <h2
              className="text-foreground mt-5 text-[clamp(1.6rem,1.3rem+1.2vw,2rem)] leading-tight font-bold"
              dir="auto"
            >
              {copy.title}
            </h2>
            <p className="text-muted-foreground mt-2 text-base" dir="auto">
              {copy.subtitle}
            </p>

            <div
              className="mt-8 flex items-start justify-between gap-1 sm:gap-3"
              dir="rtl"
              onMouseLeave={() => setHover(0)}
            >
              {LEVELS.map((level, index) => {
                const isLit = lit === level;
                const dimmed = lit !== 0 && !isLit;
                return (
                  <button
                    key={level}
                    type="button"
                    onMouseEnter={() => setHover(level)}
                    onFocus={() => setHover(level)}
                    onBlur={() => setHover(0)}
                    onClick={() => setChosen(level)}
                    aria-pressed={chosen === level}
                    className="group focus-visible:ring-ring flex flex-1 flex-col items-center gap-3 rounded-xl py-1 outline-none focus-visible:ring-2"
                  >
                    <RatingFace
                      level={level}
                      className={cn(
                        "size-[58px] transition-all duration-200 ease-out motion-reduce:transition-none sm:size-[72px]",
                        isLit && "scale-110 drop-shadow-[0_6px_14px_rgba(255,160,60,0.35)]",
                        dimmed && "opacity-45 grayscale",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm transition-colors duration-200",
                        isLit ? "text-foreground font-bold" : "text-muted-foreground",
                      )}
                      dir="auto"
                    >
                      {copy.labels[index]}
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence initial={false}>
              {chosen !== 0 && (
                <motion.div
                  key="comment"
                  initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={comment}
                    onChange={(event) =>
                      setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))
                    }
                    placeholder={placeholder}
                    rows={4}
                    dir="auto"
                    className="border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 mt-7 block min-h-[120px] w-full resize-none rounded-xl border p-4 text-base outline-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className={cn("mt-6 flex items-center gap-4", chosen !== 0 && "flex-row-reverse")}>
              {chosen !== 0 && (
                <button
                  type="button"
                  onClick={send}
                  className="bg-foreground text-background hover:bg-foreground/90 h-14 flex-1 rounded-xl text-lg font-semibold transition-colors"
                >
                  <span dir="auto">{copy.send}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground px-2 py-2 text-base transition-colors"
              >
                <span dir="auto">{copy.notNow}</span>
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>,
    document.body,
  );
}
