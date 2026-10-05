/**
 * Testers exempt from the sitewide free-access promotion (/admin/free-access).
 * While the promotion is on, getAccessState() treats every visitor as Premium,
 * which hides the price and the checkout button, so the paid flow can't be
 * tried on any account at all. An email listed in FREE_ACCESS_EXCLUDED_EMAILS
 * skips the promotion and gets its real plan instead (free until a purchase
 * makes it Premium), while everyone else keeps the promotion.
 *
 * The list can only take access away from an account, never grant it, so a
 * wrong entry, or someone signing up with a listed address, can't unlock
 * anything. That is why matching the signed-in email is enough and no further
 * proof of ownership is needed.
 */

/**
 * The emails in a comma, semicolon or whitespace separated list, lowercased.
 * Quotes, brackets and angle brackets around an entry are dropped, since a
 * value pasted into a dashboard often arrives as "a@b.com" or <a@b.com>.
 */
export function parseExcludedEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(/[\s,;]+/)
      .map((email) =>
        email
          .trim()
          .toLowerCase()
          .replace(/^["'<([]+|[>"')\]]+$/g, ""),
      )
      .filter((email) => email !== ""),
  );
}

/**
 * Whether the sitewide promotion makes this visitor Premium. A signed-out
 * visitor, or a signed-in one with no email, is never on the list, so the
 * promotion applies to them exactly as before.
 */
export function freeForAllAppliesTo(
  freeForAll: boolean,
  email: string | null | undefined,
  excludedEmailsRaw: string | undefined,
): boolean {
  if (!freeForAll) return false;
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return true;
  return !parseExcludedEmails(excludedEmailsRaw).has(normalized);
}
