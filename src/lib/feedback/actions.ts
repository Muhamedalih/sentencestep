"use server";

import { getCurrentUser } from "@/lib/supabase/auth";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";
import { buildAppRatingRecord, type AppRatingInsert } from "@/lib/feedback/rating-record";
import type { LearningMode } from "@/types/content";
import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * Saves one optional app-rating submission (RatingModal). It is kept in the
 * `app_ratings` table (Admin > Ratings lists, filters and answers them, and the
 * best ones can be shown on the site later), and — while RATINGS_WEBHOOK_URL
 * is set — also sent to the original Google Sheet via its Apps Script Web App,
 * as a backup. Identity is resolved from the session here, never trusted from
 * the caller, same as trackAudioPlayedAction — the client can only ever say
 * "guest" by having no session, never claim to be one. Never throws: exactly
 * like track() in src/lib/analytics/track.ts, a failure here (misconfigured env
 * vars, the database or sheet endpoint being down) must never surface to the
 * learner or block the thank-you screen they've already been shown by the time
 * this resolves. The two destinations are independent: one failing never stops
 * the other.
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
  /** A guest's optional address to be answered at. Ignored for a signed-in learner, whose account email is used. */
  contactEmail?: string;
}): Promise<void> {
  const user = await getCurrentUser();
  const record = buildAppRatingRecord(input, user && { id: user.id, email: user.email });
  if (!record) {
    console.warn("[app-rating] rejected out-of-range rating", { received: input.rating });
    return;
  }

  await Promise.all([saveToDatabase(record), sendToSheet(record, input)]);
}

async function saveToDatabase(record: AppRatingInsert): Promise<void> {
  if (!isServiceRoleConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[app-rating:dev] Supabase service role not configured, would save", record);
    }
    return;
  }

  try {
    const { error } = await createServiceRoleClient().from("app_ratings").insert(record);
    // Never the comment, email or anon id: those are the learner's own words and identifiers.
    if (error) {
      console.error("[app-rating] database insert failed", {
        code: error.code,
        message: error.message,
      });
    }
  } catch (err) {
    console.error("[app-rating] database insert failed", err);
  }
}

async function sendToSheet(
  record: AppRatingInsert,
  input: { lessonId: string; mode: string; anonId: string },
): Promise<void> {
  const webhookUrl = process.env.RATINGS_WEBHOOK_URL;
  const secret = process.env.RATINGS_WEBHOOK_SECRET;
  if (!webhookUrl || !secret) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[app-rating:dev] RATINGS_WEBHOOK_URL/SECRET not configured, would send",
        record,
      );
    }
    return;
  }

  try {
    // Same fields as before the database existed, so the Apps Script keeps
    // working untouched. The sheet deliberately never gets an email address.
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        rating: record.rating,
        comment: record.comment,
        lessonId: input.lessonId,
        mode: input.mode,
        locale: record.locale,
        userType: record.user_type,
        anonId: input.anonId,
      }),
    });
    // What the sheet endpoint answered — so a rating that looks wrong in the
    // sheet can be traced to this side (the value sent) or the Apps Script side
    // (what it stored). Never the comment or anonId: those are the learner's own
    // words and identifier. The endpoint's reply is its own text, not learner data.
    const reply = (await response.text().catch(() => "")).slice(0, 200);
    console.info("[app-rating] sent to sheet", {
      sent: record.rating,
      mode: input.mode,
      userType: record.user_type,
      status: response.status,
      reply,
    });
  } catch (err) {
    console.error("[app-rating] sheet submit failed", err);
  }
}
