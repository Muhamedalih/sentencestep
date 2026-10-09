"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { LearnerReviews } from "@/components/marketing/learner-reviews";
import { parseReviewsResponse, type ReviewItem } from "@/lib/feedback/reviews-display";

/**
 * The rotating box of approved learner ratings on the very first screen a new
 * visitor sees (IntroLanding). That screen is part of statically built pages, so
 * the ratings are fetched from /api/reviews once it is on screen — which also
 * means the box simply fades in a moment later instead of delaying the screen.
 * Nothing at all is shown when there is nothing to show or the request fails.
 * Rendered only while IntroLanding itself is visible, so a returning visitor
 * never makes the request.
 */
export function IntroReviews() {
  const [items, setItems] = useState<ReviewItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/reviews", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => setItems(parseReviewsResponse(json)))
      .catch(() => {
        // Decoration only: no ratings to show is the same as no box.
      });
    return () => controller.abort();
  }, []);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <LearnerReviews items={items} />
    </motion.div>
  );
}
