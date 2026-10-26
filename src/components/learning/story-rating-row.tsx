"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Star } from "lucide-react";

import { RatingModal } from "@/components/learning/rating-modal";
import { useLocale } from "@/components/providers/locale-provider";
import type { LearningMode } from "@/types/content";

/**
 * The quiet row of five stars at the foot of a story's finish page ("How was the story?"), in
 * place of the automatic rating pop-up the other lessons show. Tapping a star opens RatingModal
 * with that many stars already chosen, so a learner can send it as it is or add a comment first;
 * once sent, the row keeps the stars they gave and goes still. The modal is portalled to the
 * body: the finish page animates its children, and a transformed ancestor would pin the modal's
 * `fixed` box to itself instead of the screen.
 */
export function StoryRatingRow({
  lessonId,
  mode,
  color,
  accentColor,
}: {
  lessonId: string;
  mode: LearningMode;
  /** The question's colour and the unlit stars' — the page's secondary text colour. */
  color: string;
  /** The lit stars' colour — the page's accent. */
  accentColor: string;
}) {
  const { t } = useLocale();
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
        <span dir="auto">{t.lesson.storyEnd.ratingQuestion}</span>
        <span className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={sent > 0}
              aria-label={(n === 1
                ? t.rateApp.starLabelSingular
                : t.rateApp.starLabelPlural
              ).replace("{n}", String(n))}
              onClick={() => {
                setChosen(n);
                setOpen(true);
              }}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              className="flex size-8 items-center justify-center rounded-full transition-transform enabled:hover:scale-110 pointer-coarse:size-10"
            >
              <Star
                aria-hidden="true"
                className="size-3.5"
                style={n <= lit ? { color: accentColor, fill: accentColor } : undefined}
              />
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
