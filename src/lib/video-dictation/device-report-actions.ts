"use server";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";

import { sanitizeDeviceReport } from "./device-diag";

/**
 * An Admin's device says how the video's stops land on it: the readings behind each stop, the player's
 * length of the video, how many readings looked like an ad. It goes to the audit log, where it is read
 * to find out why a stop is late on a tablet and not on a computer. Admin-only (the practice page offers
 * it to nobody else) and a few small calls per video, so it costs nothing at scale.
 */
export async function reportVideoDeviceAction(input: unknown): Promise<{ ok: boolean }> {
  if (await requireAdmin()) return { ok: false };
  const report = sanitizeDeviceReport(input);
  if (!report) return { ok: false };
  await logAdminAction("video.device_report", "video_device", report.videoId, { ...report });
  return { ok: true };
}
