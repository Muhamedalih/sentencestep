"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { submitAppRatingAction } from "@/lib/feedback/actions";
import { getOrCreateAnonId, markRatedApp } from "@/lib/feedback/rating-storage";
import { popIn, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LearningMode } from "@/types/content";

const MAX_COMMENT_LENGTH = 2000;

/**
 * The actual 5-star + comment card — the one visual/interaction surface
 * shared by both RatingPrompt's one-time automatic pop-up (after a
 * learner's second lesson ever) and Settings' always-available "Rate
 * SentenceStep" card (RateAppCard). Purely controlled: owns none of the
 * "should this even be offered right now" decision — that's each caller's
 * job (see RatingPrompt's own doc comment for the automatic case's
 * one-time gate). A successful submit always calls markRatedApp()
 * regardless of which caller opened this, so rating from Settings also
 * retires the automatic prompt for good — there's no reason to still nag a
 * learner who already told us what they think.
 */
export function RatingModal({
  open,
  onOpenChange,
  lessonId,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  /** "settings" identifies a rating given from the always-available Settings card rather than right after a real lesson. */
  mode: LearningMode | "settings";
}) {
  const { t, locale } = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // A fresh form every time this opens — a previous rating/comment/thanks
  // state should never linger into the next time it's opened.
  useEffect(() => {
    if (!open) return;
    setRating(0);
    setComment("");
    setSubmitted(false);
  }, [open]);

  function handleSkip() {
    onOpenChange(false);
  }

  function handleSubmit() {
    if (rating === 0) return;
    void submitAppRatingAction({
      rating,
      comment,
      lessonId,
      mode,
      locale,
      anonId: getOrCreateAnonId(),
    });
    markRatedApp();
    setSubmitted(true);
    window.setTimeout(() => onOpenChange(false), 1800);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transitions.snappy}
          role="dialog"
          aria-modal="true"
          aria-label={t.rateApp.headline}
        >
          <motion.div
            variants={prefersReducedMotion ? undefined : popIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#16161c] p-6 text-center text-white shadow-2xl"
          >
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-full">
                  <Check className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold">{t.rateApp.thanksTitle}</h3>
                <p className="text-sm text-white/60">{t.rateApp.thanksBody}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="text-[17px] font-bold text-balance">{t.rateApp.headline}</h3>
                <p className="text-sm leading-relaxed text-white/60">{t.rateApp.subtitle}</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      aria-label={(i === 1
                        ? t.rateApp.starLabelSingular
                        : t.rateApp.starLabelPlural
                      ).replace("{n}", String(i))}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "size-7 transition-colors",
                          i <= rating ? "text-primary fill-primary" : "text-white/25",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  id="rating-modal-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  placeholder={t.rateApp.commentPlaceholder}
                  className="focus:border-primary min-h-16 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
                />
                <div className="flex gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    className="flex-1 border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    {t.rateApp.skip}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={rating === 0}
                    className="flex-1"
                  >
                    {t.rateApp.submit}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
