"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Star, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useLocale } from "@/components/providers/locale-provider";
import {
  trackRatingPromptSkippedAction,
  trackRatingSentimentSelectedAction,
} from "@/lib/analytics/track-actions";
import { submitAppRatingAction } from "@/lib/feedback/actions";
import { getOrCreateAnonId, markRatedApp } from "@/lib/feedback/rating-storage";
import { popIn, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LearningMode } from "@/types/content";

const MAX_COMMENT_LENGTH = 2000;
/** Mirrors feedback/actions.ts's own MIN_TESTIMONIAL_RATING — only a 4-5 star rating is ever offered the "show this publicly" consent checkbox. */
const MIN_TESTIMONIAL_RATING = 4;

type Step = "sentiment" | "stars" | "starsRated" | "negative" | "thanks";

/**
 * The actual rating card — one visual/interaction surface shared by both
 * RatingPrompt's automatic pop-up and Settings' always-available "Rate
 * SentenceStep" card (RateAppCard). Purely controlled: owns none of the
 * "should this even be offered right now" decision — that's each caller's
 * job (see RatingPrompt's own doc comment for its bounded-retry gate).
 *
 * Flow: a lightweight sentiment check first (positive routes to the 5-star
 * ask, negative routes to a private "what could we do better" note) rather
 * than asking everyone for stars outright — a learner having a rough time
 * gets an outlet that isn't "leave us a public-feeling rating", and a happy
 * learner reaches the actual ask faster either way. Tapping a star submits
 * immediately (no separate "submit" step for the rating itself) — a
 * comment afterward is a fully optional bonus, so the rating itself is
 * never lost to someone who taps a star and then closes the tab. A
 * successful submission (star tap or a sent negative note) always calls
 * markRatedApp() regardless of which caller opened this, so rating from
 * Settings also retires the automatic prompt for good — there's no reason
 * to still nag a learner who already told us what they think.
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
  const userId = useAuthUserId();
  const [step, setStep] = useState<Step>("sentiment");
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [negativePath, setNegativePath] = useState(false);

  // A fresh form every time this opens — a previous step/rating/comment
  // state should never linger into the next time it's opened.
  useEffect(() => {
    if (!open) return;
    setStep("sentiment");
    setRating(0);
    setHoverStar(null);
    setComment("");
    setConsent(false);
    setNegativePath(false);
  }, [open]);

  // The terminal "thanks" step auto-closes shortly after — every path here
  // (star tap alone, star + comment, or a sent negative note) ends up here.
  useEffect(() => {
    if (step !== "thanks") return;
    const timeout = window.setTimeout(() => onOpenChange(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [step, onOpenChange]);

  function handleSentiment(sentiment: "positive" | "negative") {
    void trackRatingSentimentSelectedAction(sentiment);
    if (sentiment === "positive") {
      setStep("stars");
    } else {
      setNegativePath(true);
      setStep("negative");
    }
  }

  function handleStarTap(value: number) {
    setRating(value);
    markRatedApp();
    void submitAppRatingAction({
      rating: value,
      comment: "",
      lessonId,
      mode,
      locale,
      anonId: getOrCreateAnonId(),
    });
    setStep("starsRated");
  }

  function handleSendComment() {
    void submitAppRatingAction({
      rating,
      comment,
      lessonId,
      mode,
      locale,
      anonId: getOrCreateAnonId(),
      consentToPublish: consent,
    });
    setStep("thanks");
  }

  function handleSendNegative() {
    if (!comment.trim()) return;
    markRatedApp();
    void submitAppRatingAction({
      rating: null,
      comment,
      lessonId,
      mode,
      locale,
      anonId: getOrCreateAnonId(),
    });
    setStep("thanks");
  }

  function handleSkip(skippedStep: "sentiment" | "stars" | "negative") {
    void trackRatingPromptSkippedAction(skippedStep);
    onOpenChange(false);
  }

  const canOfferConsent = Boolean(userId) && rating >= MIN_TESTIMONIAL_RATING;

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
            {step === "sentiment" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-[17px] font-bold text-balance">{t.rateApp.headline}</h3>
                <p className="text-sm leading-relaxed text-white/60">{t.rateApp.subtitle}</p>
                <div className="mt-1 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSentiment("positive")}
                    className="hover:border-primary/50 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-4 transition-colors hover:bg-white/10"
                  >
                    <ThumbsUp className="text-primary size-6" aria-hidden="true" />
                    <span className="text-sm font-medium">{t.rateApp.sentimentPositive}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSentiment("negative")}
                    className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-4 transition-colors hover:border-white/30 hover:bg-white/10"
                  >
                    <ThumbsDown className="size-6 text-white/70" aria-hidden="true" />
                    <span className="text-sm font-medium">{t.rateApp.sentimentNegative}</span>
                  </button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleSkip("sentiment")}
                  className="text-white/50 hover:bg-white/5 hover:text-white"
                >
                  {t.rateApp.skip}
                </Button>
              </div>
            )}

            {step === "stars" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-[17px] font-bold text-balance">{t.rateApp.starsHeadline}</h3>
                <div
                  className="flex justify-center gap-2 py-2"
                  onMouseLeave={() => setHoverStar(null)}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleStarTap(i)}
                      onMouseEnter={() => setHoverStar(i)}
                      aria-label={(i === 1
                        ? t.rateApp.starLabelSingular
                        : t.rateApp.starLabelPlural
                      ).replace("{n}", String(i))}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "size-9 transition-colors",
                          i <= (hoverStar ?? 0) ? "text-primary fill-primary" : "text-white/25",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleSkip("stars")}
                  className="text-white/50 hover:bg-white/5 hover:text-white"
                >
                  {t.rateApp.skip}
                </Button>
              </div>
            )}

            {step === "starsRated" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-3 py-1">
                  <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-full">
                    <Check className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold">{t.rateApp.thanksTitle}</h3>
                  <div className="flex gap-1" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-4",
                          i <= rating ? "text-primary fill-primary" : "text-white/25",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/60">
                  {t.rateApp.addCommentPrompt}
                </p>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  placeholder={t.rateApp.commentPlaceholder}
                  className="focus:border-primary min-h-16 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
                />
                {canOfferConsent && (
                  <label className="flex items-start gap-2 text-start text-xs text-white/60">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                      className="mt-0.5"
                    />
                    {t.rateApp.consentLabel}
                  </label>
                )}
                <div className="flex gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("thanks")}
                    className="flex-1 border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    {t.rateApp.done}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSendComment}
                    disabled={!comment.trim()}
                    className="flex-1"
                  >
                    {t.rateApp.sendComment}
                  </Button>
                </div>
              </div>
            )}

            {step === "negative" && (
              <div className="flex flex-col gap-4">
                <h3 className="text-[17px] font-bold text-balance">{t.rateApp.negativeHeadline}</h3>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  placeholder={t.rateApp.negativePlaceholder}
                  autoFocus
                  className="focus:border-primary min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
                />
                <div className="flex gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleSkip("negative")}
                    className="flex-1 border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    {t.rateApp.skip}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSendNegative}
                    disabled={!comment.trim()}
                    className="flex-1"
                  >
                    {t.rateApp.submit}
                  </Button>
                </div>
              </div>
            )}

            {step === "thanks" && (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-full">
                  <Check className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold">{t.rateApp.thanksTitle}</h3>
                <p className="text-sm text-white/60">
                  {negativePath ? t.rateApp.negativeThanksBody : t.rateApp.thanksBody}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
