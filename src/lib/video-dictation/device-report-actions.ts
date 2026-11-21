"use server";

import { after } from "next/server";

import { track } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/supabase/auth";

import { sanitizeDeviceReport } from "./device-diag";

/**
 * A device says how the video's stops land on it: the readings behind each stop, how long the player takes
 * to pause and to play, how stale its own estimate of the time gets, the length it reports for the video.
 * Written as the VIDEO_DEVICE_REPORT event, to read why a stop is late on an iPad and not on a computer.
 * The page sends it from every Apple browser, from an Admin's device and from one visit in ten of the
 * others (a few small calls per video, at the 3rd, 6th and 10th stop and at the end), and the whole report
 * arrives as client input, so it is re-checked and the call silently does nothing when it does not fit.
 * Numbers only: no word, no typed text. A guest's report is recorded too, with no account.
 */
export async function reportVideoDeviceAction(input: unknown): Promise<void> {
  try {
    const report = sanitizeDeviceReport(input);
    if (!report) return;
    const user = await getCurrentUser();
    const userId = user?.id ?? null;
    after(() =>
      track({ name: "VIDEO_DEVICE_REPORT", category: "ENGAGEMENT", properties: report }, userId),
    );
  } catch (error) {
    console.error("[video] reportVideoDeviceAction failed", error);
  }
}
