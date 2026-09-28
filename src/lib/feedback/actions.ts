"use server";

import { track } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { LearningMode } from "@/types/content";
import type { SupportLocale } from "@/lib/i18n/locales";

const MAX_COMMENT_LENGTH = 2000;
/** A testimonial worth showing publicly starts at 4 stars — below that, a comment is still valuable internal feedback but never a quote for the homepage. */
const MIN_TESTIMONIAL_RATING = 4;

/**
 * Sends one app-rating submission (RatingModal) to an external Google Sheet
 * via a Google Apps Script Web App — deliberately not Supabase, per the
 * product decision to keep this feedback in a place non-technical admins
 * can browse/chart directly. Identity is resolved from the session here,
 * never trusted from the caller, same as trackAudioPlayedAction — the
 * client can only ever say "guest" by having no session, never claim to be
 * one. The Sheet submission never throws (a misconfigured env var or a
 * down endpoint must never block the thank-you screen the learner's
 * already seen by the time this resolves), but this action separately (a)
 * records an ENGAGEMENT analytics event every time, and (b) — only when
 * `consentToPublish` is set on a signed-in learner's 4-5 star rating with
 * an actual comment — inserts a row into app_testimonials for an admin to
 * later approve onto the marketing homepage (see Admin > Testimonials).
 * Those two are best-effort too, same reasoning.
 *
 * `rating` is null on RatingModal's negative-sentiment path: a written
 * "what could we do better" note with no star attached, never a testimonial
 * candidate regardless of `consentToPublish`.
 */
export async function submitAppRatingAction(input: {
  rating: number | null;
  comment: string;
  lessonId: string;
  /** "settings" identifies a rating given from Settings' always-available card rather than right after a real lesson. */
  mode: LearningMode | "settings";
  /** Null means the un-prefixed English default — see useLocale()'s own doc comment. */
  locale: SupportLocale | null;
  anonId: string;
  /** RatingModal's "show my review on the homepage" checkbox — only offered for a signed-in learner's 4-5 star rating, silently ignored otherwise. */
  consentToPublish?: boolean;
}): Promise<void> {
  const rating = input.rating === null ? null : Math.round(input.rating);
  if (rating !== null && !(rating >= 1 && rating <= 5)) return;
  const comment = input.comment.trim().slice(0, MAX_COMMENT_LENGTH);
  if (rating === null && !comment) return;

  const user = await getCurrentUser();
  const source: "prompt" | "settings" = input.mode === "settings" ? "settings" : "prompt";

  const webhookUrl = process.env.RATINGS_WEBHOOK_URL;
  const secret = process.env.RATINGS_WEBHOOK_SECRET;
  if (webhookUrl && secret) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          rating,
          comment,
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
  } else if (process.env.NODE_ENV !== "production") {
    console.info("[app-rating:dev] RATINGS_WEBHOOK_URL/SECRET not configured, would send", {
      ...input,
      rating,
      comment,
    });
  }

  await track(
    rating !== null
      ? {
          name: "RATING_STARS_SUBMITTED",
          category: "ENGAGEMENT",
          properties: { rating, hasComment: comment.length > 0, source },
        }
      : {
          name: "RATING_NEGATIVE_FEEDBACK_SUBMITTED",
          category: "ENGAGEMENT",
          properties: { source },
        },
    user?.id ?? null,
  );

  if (
    input.consentToPublish &&
    user &&
    rating !== null &&
    rating >= MIN_TESTIMONIAL_RATING &&
    comment
  ) {
    try {
      // First name only — RatingModal's consent checkbox promises "first
      // name only" for what shows on the public homepage, never the full
      // display name a learner may have set for their own account.
      const firstName = user.displayName?.trim().split(/\s+/)[0] ?? null;
      const supabase = await createClient();
      const { error } = await supabase.from("app_testimonials").insert({
        user_id: user.id,
        display_name: firstName,
        rating,
        comment,
        locale: input.locale,
      });
      if (error) console.error("[app-rating] testimonial insert failed", error);
    } catch (error) {
      console.error("[app-rating] testimonial insert failed", error);
    }
  }
}
