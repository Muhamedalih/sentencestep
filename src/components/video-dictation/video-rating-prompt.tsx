"use client";

import { useEffect, useState } from "react";

import { RatingModal } from "@/components/learning/rating-modal";
import { hasRatedVideo, markRatedVideo } from "@/lib/feedback/rating-storage";

/** How long the finish screen is left alone before the question appears. */
const SHOW_AFTER_MS = 1800;

/**
 * The one-time "what do you think of Video?" card, the same rating pop-up the rest of the app uses
 * (RatingModal, mode "video"): it appears over the finish screen of the first video a learner
 * finishes, never more than once per browser whatever they do with it, and is kept in Admin > Ratings
 * under its own "Video" tab. Like PassageRatingPrompt the flag is set the instant the card is shown,
 * and a browser whose storage can't be read counts as "already shown".
 */
export function VideoRatingPrompt({ videoId }: { videoId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasRatedVideo()) return;
    const timer = window.setTimeout(() => {
      markRatedVideo();
      setVisible(true);
    }, SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return <RatingModal open={visible} onOpenChange={setVisible} lessonId={videoId} mode="video" />;
}
