"use server";

import { getCurrentUser } from "@/lib/supabase/auth";
import type { LearningMode } from "@/types/content";
import type { SupportLocale } from "@/lib/i18n/locales";

const MAX_COMMENT_LENGTH = 2000;

/**
 * Sends one optional app-rating submission (RatingModal) to an external
 * Google Sheet via a Google Apps Script Web App — deliberately not Supabase,
 * per the product decision to keep this feedback in a place non-technical
 * admins can browse/chart directly. Identity is resolved from the session
 * here, never trusted from the caller, same as trackAudioPlayedAction — the
 * client can only ever say "guest" by having no session, never claim to be
 * one. Never throws: exactly like track() in src/lib/analytics/track.ts, a
 * failure here (misconfigured env vars, the sheet endpoint being down) must
 * never surface to the learner or block the thank-you screen they've
 * already been shown by the time this resolves.
 */
export async function submitAppRatingAction(input: {
  rating: number;
  comment: string;
  lessonId: string;
  /** "settings" identifies a rating given from Settings' always-available card rather than right after a real lesson. */
  mode: LearningMode | "settings";
  /** Null means the un-prefixed English default — see useLocale()'s own doc comment. */
  locale: SupportLocale | null;
  anonId: string;
}): Promise<void> {
  const webhookUrl = process.env.RATINGS_WEBHOOK_URL;
  const secret = process.env.RATINGS_WEBHOOK_SECRET;
  if (!webhookUrl || !secret) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[app-rating:dev] RATINGS_WEBHOOK_URL/SECRET not configured, would send", input);
    }
    return;
  }

  const rating = Math.round(input.rating);
  if (!(rating >= 1 && rating <= 5)) return;

  const user = await getCurrentUser();

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        rating,
        comment: input.comment.trim().slice(0, MAX_COMMENT_LENGTH),
        lessonId: input.lessonId,
        mode: input.mode,
        locale: input.locale ?? "en",
        userType: user ? "member" : "guest",
        anonId: input.anonId,
      }),
    });
  } catch (err) {
    console.error("[app-rating] submit failed", err);
  }
}
