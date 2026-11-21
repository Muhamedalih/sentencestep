"use client";

import { useMemo, useRef } from "react";

import type { StopSample } from "@/lib/video-dictation/device-diag";
import { MAX_PLAY_SAMPLES, MAX_STOPS_PER_REPORT } from "@/lib/video-dictation/device-diag";
import { reportVideoDeviceAction } from "@/lib/video-dictation/device-report-actions";
import { isAppleWebKit } from "@/lib/video-dictation/segments";

/** The report goes out after this many stops of the visit (and once more when the video is finished). */
const SEND_AT_STOP = new Set([3, 6, 10, 16]);

/**
 * Collects how the video's stops land on this device (see DeviceReport) and sends it as an analytics
 * event a few times per video, when `enabled` (every Apple browser, an Admin's device and one visit in
 * ten of the others). This is how a tablet's late stop is measured instead of guessed.
 */
export function useDeviceReport({
  enabled,
  videoId,
  expectedDuration,
  getContext,
}: {
  enabled: boolean;
  videoId: string;
  expectedDuration: number;
  /** The delay the page has learned and the Admin's offset, read when a report is sent. */
  getContext: () => { learnedLead: number; offset: number };
}) {
  const data = useRef({
    stops: [] as StopSample[],
    playMs: [] as number[],
    total: 0,
    sent: 0,
    adReadings: 0,
    needsTaps: 0,
    seenDuration: null as number | null,
  });
  const context = useRef(getContext);
  context.current = getContext;

  return useMemo(() => {
    const send = () => {
      if (!enabled) return;
      const state = data.current;
      if (state.stops.length === 0 && state.adReadings === 0 && state.needsTaps === 0) return;
      // Nothing new since the last report: nothing to say.
      if (state.sent === state.total + state.adReadings + state.needsTaps) return;
      state.sent = state.total + state.adReadings + state.needsTaps;
      const { learnedLead, offset } = context.current();
      reportVideoDeviceAction({
        videoId,
        userAgent: navigator.userAgent,
        touchPoints: navigator.maxTouchPoints,
        apple: isAppleWebKit(navigator.userAgent, navigator.maxTouchPoints),
        learnedLead,
        offset,
        expectedDuration,
        seenDuration: state.seenDuration,
        adReadings: state.adReadings,
        needsTaps: state.needsTaps,
        playMs: state.playMs.slice(-MAX_PLAY_SAMPLES),
        stops: state.stops.slice(-MAX_STOPS_PER_REPORT),
      }).catch(() => undefined);
    };
    return {
      /** A stop was measured: where it was asked for, what fired it, where the video rested. */
      stop(sample: StopSample) {
        if (!enabled) return;
        const state = data.current;
        state.stops.push(sample);
        if (state.stops.length > MAX_STOPS_PER_REPORT) state.stops.shift();
        state.total += 1;
        if (SEND_AT_STOP.has(state.total)) send();
      },
      /** The player said "playing" this many ms after the page asked it to play. */
      played(ms: number) {
        if (!enabled) return;
        data.current.playMs.push(ms);
        if (data.current.playMs.length > MAX_PLAY_SAMPLES) data.current.playMs.shift();
      },
      /** A reading was taken for an ad because the player's length was not the video's: what it said. */
      ad(playerDuration: number) {
        if (!enabled) return;
        data.current.adReadings += 1;
        if (Number.isFinite(playerDuration)) data.current.seenDuration = playerDuration;
      },
      /** The page needed a tap to carry on after a sentence. */
      needsTap() {
        if (enabled) data.current.needsTaps += 1;
      },
      send,
    };
  }, [enabled, expectedDuration, videoId]);
}
