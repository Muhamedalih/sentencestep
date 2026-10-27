import { isPlausibleEmail } from "@/lib/admin/email-validation";
import type { Database } from "@/types/database";

export const MAX_RATING_COMMENT_LENGTH = 2000;

/**
 * The `mode` of a rating given to the Passages section (its `lesson_id` is then the passage the
 * learner had just finished). The database keeps these apart from the app's own ratings — the
 * app's average and the site's quoted figure leave them out — so this value must match the one
 * written into app_rating_distribution() and passage_rating_distribution().
 */
export const PASSAGES_RATING_MODE = "passages";

/**
 * The `mode` of a rating given at the end of a words review («كلماتي»; its `lesson_id` is then
 * "bank"). It is a rating of one section like Passages', so it must be kept out of the app's own
 * figures the same way — but app_rating_distribution() still leaves out only 'passages': before
 * «كلماتي» is opened to learners that function (and the Admin → Ratings lists) must be taught to
 * set 'words' apart, or these ratings would count toward the quoted app average. While the section
 * is Admins-only the only ratings are the owner's own.
 */
export const WORDS_RATING_MODE = "words";

export type AppRatingInsert = Database["public"]["Tables"]["app_ratings"]["Insert"];

export interface AppRatingSubmission {
  /** What the browser sent — rounded and range-checked here, never trusted. */
  rating: number;
  comment: string;
  lessonId: string;
  mode: string;
  /** Null means the un-prefixed English default (see useLocale()). */
  locale: string | null;
  anonId: string;
  /** The address a guest chose to leave so we can answer them. Ignored for members. */
  contactEmail?: string;
}

/** The signed-in account, resolved from the session on the server — never from the browser. */
export interface AppRatingIdentity {
  id: string;
  email: string;
}

/**
 * Turns one submission into the row Admin > Ratings lists, or null when the
 * rating itself is out of range. Who gave it comes only from `identity`: a
 * member's reply address is their account email, and a guest's is whatever
 * they typed (kept only if it looks like an address) — so the browser can
 * never claim to be a member, nor point a member's reply at someone else.
 */
export function buildAppRatingRecord(
  input: AppRatingSubmission,
  identity: AppRatingIdentity | null,
): AppRatingInsert | null {
  const rating = Math.round(input.rating);
  if (!(rating >= 1 && rating <= 5)) return null;

  const typedEmail = (input.contactEmail ?? "").trim().toLowerCase();

  return {
    rating,
    comment: input.comment.trim().slice(0, MAX_RATING_COMMENT_LENGTH),
    lesson_id: input.lessonId.trim().slice(0, 100),
    mode: input.mode.trim().slice(0, 40),
    locale: (input.locale ?? "en").slice(0, 10),
    user_type: identity ? "member" : "guest",
    user_id: identity?.id ?? null,
    contact_email: identity
      ? identity.email.trim().toLowerCase() || null
      : isPlausibleEmail(typedEmail)
        ? typedEmail
        : null,
    anon_id: input.anonId.trim().slice(0, 100),
  };
}
