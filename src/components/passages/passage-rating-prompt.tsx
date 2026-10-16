"use client";

import { useEffect, useState } from "react";

import { RatingModal } from "@/components/learning/rating-modal";
import { hasRatedPassages, markRatedPassages } from "@/lib/feedback/rating-storage";

/** How long the finished passage's score is left alone on screen before the question appears. */
const SHOW_AFTER_MS = 1800;

/**
 * The one-time "what do you think of Passages?" card — the same rating pop-up the rest of the
 * app uses (RatingModal), worded for this section and kept in Admin > Ratings under its own
 * "Passages" tab. It appears over the end screen the first time a learner finishes a
 * passage, a moment after the score so the finish still lands, and never more than once per
 * browser whatever they do with it (rated or "Not now" count the same). Like the app's own
 * prompt (RatingPrompt) the flag is set the instant the card is shown, so closing the tab
 * mid-decision never brings it back; a browser whose storage can't be read counts as
 * "already shown". The app's own prompt is a separate gate, so neither retires the other.
 */
export function PassageRatingPrompt({
  show,
  passageId,
}: {
  /** True once the learner is on the end screen of a passage they have just finished. */
  show: boolean;
  /** The passage just finished — kept with the rating, so the answer says which one prompted it. */
  passageId: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show || hasRatedPassages()) return;
    const timer = window.setTimeout(() => {
      markRatedPassages();
      setVisible(true);
    }, SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [show]);

  return (
    <RatingModal open={visible} onOpenChange={setVisible} lessonId={passageId} mode="passages" />
  );
}
