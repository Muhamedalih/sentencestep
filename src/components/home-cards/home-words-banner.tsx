"use client";

import { useSharedProgress } from "@/components/providers/progress-provider";
import { WordsBanner } from "@/components/words/words-banner";

type BannerProps = Parameters<typeof WordsBanner>[0];

/**
 * The words banner of the words-first Home. Its button always carries the learner on («تابع»): into the
 * topic they were on, or, for a learner who has not begun, into the first topic at their chosen level.
 * Review is not the button's job here (the daily tasks and the review card own it), so no review count
 * is passed. The learner's chosen level comes from the page's shared progress.
 */
export function HomeWordsBanner(props: Omit<BannerProps, "reviewCount" | "startingLevel">) {
  const { startingLevel } = useSharedProgress();
  return <WordsBanner {...props} reviewCount={0} startingLevel={startingLevel} />;
}
