/**
 * The one value src/app/auth/callback/route.ts ever sets `?error=` to on
 * the /login redirect, when the email-confirmation code exchange fails.
 * Shared so the route that sets it and the page that reads it can't drift
 * apart into two different string literals.
 */
export const CONFIRMATION_FAILED_ERROR = "confirmation-failed";

/**
 * Whether the login page's `?error=` query param is the known
 * confirmation-failure value — checked by exact equality so an arbitrary
 * query string is never reflected back to the user as if it were a real
 * system message.
 */
export function isConfirmationFailedError(error: string | undefined): boolean {
  return error === CONFIRMATION_FAILED_ERROR;
}
