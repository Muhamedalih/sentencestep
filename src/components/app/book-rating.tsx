"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";

import { useFacesStrings } from "@/components/feedback/faces-rating-card";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { RatingFace, type FaceLevel } from "@/components/words/ladder/ladder-faces";
import { setBookRatingAction } from "@/lib/book-progress/rating-actions";
import { faceLabel } from "@/lib/feedback/faces-strings";
import { cn } from "@/lib/utils";
import type { BookRatingSummary } from "@/lib/supabase/queries/book-ratings";

const STARS = [1, 2, 3, 4, 5];

/**
 * Community, Step 1 (competitor report Section 6.3) — a plain 1-5 star
 * rating on the Book Overview page, shared by Books and Novels alike (both
 * render through this same page/component). `summary`/`initialMyRating` are
 * server-fetched props (see the [bookId] page), never fetched client-side on
 * mount, matching every other reading-state prop this page already passes
 * down. Updates optimistically on click, same "assume it saved, revert on
 * failure" idiom as useBookSentenceMark's bookmark toggle. With the faceRatings permission the five
 * stars are five faces (the look of the Words rounds' rating card): the one under the pointer lights up
 * and the others lose their colour, and the learner's own face stays lit; the average and the count
 * beside them are the same numbers.
 */
export function BookRating({
  bookId,
  summary,
  initialMyRating,
}: {
  bookId: string;
  summary: BookRatingSummary | null;
  initialMyRating: number | null;
}) {
  const { t, dir } = useLocale();
  const faces = useFeatures().rollouts.faceRatings;
  const faceNames = useFacesStrings();
  const pathname = usePathname();
  const userId = useAuthUserId();
  const isSignedIn = Boolean(userId);
  const [myRating, setMyRating] = useState(initialMyRating);
  const [displaySummary, setDisplaySummary] = useState(summary);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  function handleRate(rating: number) {
    if (!isSignedIn) return;
    const previousRating = myRating;
    const previousSummary = displaySummary;
    setMyRating(rating);
    // Optimistic average: a real recompute happens server-side on the next
    // fetch, this is only to avoid the stars looking unresponsive in between.
    setDisplaySummary((current) => {
      if (!current) return { average: rating, count: 1 };
      const hadRatedBefore = previousRating !== null;
      const nextCount = hadRatedBefore ? current.count : current.count + 1;
      const previousTotal =
        current.average * current.count - (hadRatedBefore ? previousRating! : 0);
      return { average: (previousTotal + rating) / nextCount, count: nextCount };
    });

    setBookRatingAction(bookId, rating).catch((error) => {
      console.error("Failed to save book rating", error);
      setMyRating(previousRating);
      setDisplaySummary(previousSummary);
    });
  }

  const activeRating = hoverRating ?? myRating ?? 0;

  return (
    <div className="flex flex-col gap-1.5" dir={dir}>
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHoverRating(null)}
        role={isSignedIn ? "radiogroup" : undefined}
        aria-label={t.bookLibrary.yourRatingLabel}
      >
        <span
          // The faces keep the rating card's order whatever the page's direction: the hated one on the left, the loved one on the right.
          className={faces ? "flex items-center gap-1" : "contents"}
          dir={faces ? "ltr" : undefined}
        >
          {STARS.map((star) => (
            <button
              key={star}
              type="button"
              disabled={!isSignedIn}
              onClick={() => handleRate(star)}
              onMouseEnter={() => isSignedIn && setHoverRating(star)}
              aria-pressed={myRating === star}
              aria-label={
                faces
                  ? faceLabel(faceNames, star)
                  : t.bookLibrary.rateStarsLabel.replace("{n}", String(star))
              }
              className={cn(
                "transition-colors",
                isSignedIn ? "cursor-pointer" : "cursor-default",
                !faces &&
                  (star <= activeRating ? "text-[var(--lesson-xp)]" : "text-muted-foreground/40"),
              )}
            >
              {faces ? (
                <RatingFace
                  level={star as FaceLevel}
                  className={cn(
                    "size-7 transition-all duration-200 ease-out motion-reduce:transition-none",
                    activeRating === star &&
                      "scale-110 drop-shadow-[0_4px_10px_rgba(255,160,60,0.35)]",
                    activeRating !== 0 && activeRating !== star && "opacity-45 grayscale",
                  )}
                />
              ) : (
                <Star className="size-5" fill={star <= activeRating ? "currentColor" : "none"} />
              )}
            </button>
          ))}
        </span>
        {displaySummary && displaySummary.count > 0 && (
          <span className="text-muted-foreground ms-1.5 text-sm">
            {displaySummary.average.toFixed(1)} ·{" "}
            {t.bookLibrary.ratingCountLabel.replace("{count}", String(displaySummary.count))}
          </span>
        )}
      </div>
      {!isSignedIn && (
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="text-primary w-fit text-xs font-medium hover:underline"
        >
          {t.bookLibrary.signInToRate}
        </Link>
      )}
    </div>
  );
}
