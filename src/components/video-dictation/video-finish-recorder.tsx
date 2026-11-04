"use client";

import { useEffect, useRef } from "react";

import { useFeatures } from "@/components/providers/feature-provider";
import { recordVideoFinishAction } from "@/lib/video-dictation/finish-actions";

/**
 * Records that the learner reached the finish screen of this video, once, for the «videos finished»
 * number of Home's achievements panel. Nothing is sent while the Home cards are closed for the learner
 * (the server checks the same permission again), and a failure is ignored: the finish screen never
 * waits for it and never shows it.
 */
export function VideoFinishRecorder({ videoId }: { videoId: string }) {
  const { rollouts } = useFeatures();
  const sent = useRef(false);
  const open = rollouts.homeCards;

  useEffect(() => {
    if (!open || sent.current) return;
    sent.current = true;
    recordVideoFinishAction(videoId).catch(() => undefined);
  }, [open, videoId]);

  return null;
}
