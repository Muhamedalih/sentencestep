"use client";

import { EmailReplyPanel } from "@/components/admin/email-reply-panel";
import { replyToAppRating } from "@/lib/admin/email-actions";

/** "Reply by email" under a rating — the recipient is the rating's own contact email, resolved server-side from the rating id. */
export function RatingReplyForm({
  ratingId,
  contactEmail,
}: {
  ratingId: string;
  contactEmail: string;
}) {
  return (
    <EmailReplyPanel
      recipient={contactEmail}
      defaultSubject="Thanks for rating SentenceStep"
      send={(subject, message) => replyToAppRating(ratingId, subject, message)}
    />
  );
}
