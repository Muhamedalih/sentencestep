"use client";

import { useEffect } from "react";

import { useVideoNewsSeen } from "@/hooks/use-video-news-seen";

/** Draws nothing: opening the library is what "seen" means for the «جديد» line on Home and the tag on the menu item, whichever road the learner took to it. */
export function MarkVideoNewsSeen() {
  const { markSeen } = useVideoNewsSeen();
  useEffect(() => {
    markSeen();
  }, [markSeen]);
  return null;
}
