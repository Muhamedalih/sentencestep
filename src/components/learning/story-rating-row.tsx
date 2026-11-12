"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Star } from "lucide-react";

import { useFacesStrings } from "@/components/feedback/faces-rating-card";
import { RatingModal } from "@/components/learning/rating-modal";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { RatingFace, type FaceLevel } from "@/components/words/ladder/ladder-faces";
import { faceLabel } from "@/lib/feedback/faces-strings";
import { cn } from "@/lib/utils";
import type { LearningMode } from "@/types/content";

/**
 * The quiet row of five stars at the foot of a story's finish page ("How was the story?"), in
 * place of the automatic rating pop-up the other lessons show. Tapping a star opens RatingModal
 * with that many stars already chosen, so a learner can send it as it is or add a comment first;
 * once sent, the row keeps the stars they gave and goes still. With the faceRatings permission the
 * five stars are five small faces (the look of the Words rounds' rating card): the one under the
 * pointer lights up and the others lose their colour, a tap opens the same card with that face
 * chosen, and once sent the row keeps the face they gave. The modal is portalled to the
 * body: the finish page animates its children, and a transformed ancestor would pin the modal's
 * `fixed` box to itself instead of the screen.
 */
export function StoryRatingRow({
  lessonId,
  mode,
  color,
  accentColor,
  question,
}: {
  lessonId: string;
  /** A story's mode, or "words": the same quiet row at the end of a words review (see BankReviewSession). */
  mode: LearningMode | "words";
  /** The question's colour and the unlit stars' — the page's secondary text colour. */
  color: string;
  /** The lit stars' colour — the page's accent. */
  accentColor: string;
  /** Replaces the story's own question ("How was the story?"). */
  question?: string;
}) {
  const { t } = useLocale();
  const faces = useFeatures().rollouts.faceRatings;
  const faceNames = useFacesStrings();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState(0);
  const [sent, setSent] = useState(0);
  const [hover, setHover] = useState(0);
  useEffect(() => setMounted(true), []);

  const lit = sent || hover;
  return (
    <>
      <div
        style={{ color }}
        className="flex flex-wrap items-center justify-center gap-x-2 text-[11px]"
      >
        <span dir="auto">{question ?? t.lesson.storyEnd.ratingQuestion}</span>
        <span
          className={cn("flex", faces && "items-center gap-1")}
          // The faces keep the card's order whatever the page's direction: the hated one on the left, the loved one on the right.
          dir={faces ? "ltr" : undefined}
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={sent > 0}
              aria-label={
                faces
                  ? faceLabel(faceNames, n)
                  : (n === 1 ? t.rateApp.starLabelSingular : t.rateApp.starLabelPlural).replace(
                      "{n}",
                      String(n),
                    )
              }
              onClick={() => {
                setChosen(n);
                setOpen(true);
              }}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              className={cn(
                "flex items-center justify-center rounded-full",
                faces
                  ? "size-9 pointer-coarse:size-11"
                  : "size-8 transition-transform enabled:hover:scale-110 pointer-coarse:size-10",
              )}
            >
              {faces ? (
                <RatingFace
                  level={n as FaceLevel}
                  className={cn(
                    "size-6 transition-all duration-200 ease-out motion-reduce:transition-none",
                    lit === n && "scale-125 drop-shadow-[0_4px_8px_rgba(255,160,60,0.35)]",
                    lit !== 0 && lit !== n && "opacity-45 grayscale",
                  )}
                />
              ) : (
                <Star
                  aria-hidden="true"
                  className="size-3.5"
                  style={n <= lit ? { color: accentColor, fill: accentColor } : undefined}
                />
              )}
            </button>
          ))}
        </span>
      </div>
      {mounted &&
        createPortal(
          <RatingModal
            open={open}
            onOpenChange={setOpen}
            lessonId={lessonId}
            mode={mode}
            initialRating={chosen}
            onSubmitted={setSent}
          />,
          document.body,
        )}
    </>
  );
}
