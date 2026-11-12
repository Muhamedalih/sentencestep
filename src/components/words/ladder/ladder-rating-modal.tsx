"use client";

import { FacesRatingCard } from "@/components/feedback/faces-rating-card";
import { useLocale } from "@/components/providers/locale-provider";
import { submitAppRatingAction } from "@/lib/feedback/actions";
import { ROUNDS_RATING_LESSON_ID, WORDS_RATING_MODE } from "@/lib/feedback/rating-record";
import { getOrCreateAnonId } from "@/lib/feedback/rating-storage";
import { ladderStrings } from "@/lib/word-ladder/strings";

/**
 * The rating card of the word rounds: the five-faces card every rating of the app shares (see
 * FacesRatingCard), with this section's tag and words. It is saved in the ratings table as a rating of
 * the words section (mode "words", lesson id "rounds"), so Admin > Ratings lists it on its own tab and
 * the site's average never includes it. "Not now" (and Escape, and a tap outside) close it without
 * sending anything.
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

  return (
    <FacesRatingCard
      open={open}
      tag={copy.tag}
      title={copy.title}
      subtitle={copy.subtitle}
      copy={copy}
      thanksMs={1300}
      onSend={(level, comment) => {
        void submitAppRatingAction({
          rating: level,
          comment,
          lessonId: ROUNDS_RATING_LESSON_ID,
          mode: WORDS_RATING_MODE,
          locale,
          anonId: getOrCreateAnonId(),
        }).catch(() => {});
      }}
      onSkip={onSkip}
      onDone={onRated}
    />
  );
}
