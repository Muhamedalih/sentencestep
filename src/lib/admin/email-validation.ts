/** Limits for the emails an admin sends by hand (Admin > Users / Reports). */
export const ADMIN_EMAIL_SUBJECT_MAX_LENGTH = 150;
export const ADMIN_EMAIL_MESSAGE_MAX_LENGTH = 5000;

export interface AdminEmailInput {
  subject: string;
  message: string;
}

export type AdminEmailValidation =
  { ok: true; value: AdminEmailInput } | { ok: false; error: string };

// Deliberately loose — the provider is the real judge of deliverability; this
// only rejects what is clearly not an address before it reaches the provider.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isPlausibleEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

/**
 * Subject line breaks are collapsed to spaces (a subject is one line, and a
 * stray CR/LF should never reach a mail header); the message keeps its own
 * line breaks, which the template turns into paragraphs.
 */
export function validateAdminEmailInput(input: AdminEmailInput): AdminEmailValidation {
  const subject = input.subject.replace(/[\r\n]+/g, " ").trim();
  const message = input.message.trim();

  if (!subject) return { ok: false, error: "Enter a subject." };
  if (subject.length > ADMIN_EMAIL_SUBJECT_MAX_LENGTH)
    return {
      ok: false,
      error: `The subject must be ${ADMIN_EMAIL_SUBJECT_MAX_LENGTH} characters or fewer.`,
    };
  if (!message) return { ok: false, error: "Write a message." };
  if (message.length > ADMIN_EMAIL_MESSAGE_MAX_LENGTH)
    return {
      ok: false,
      error: `The message must be ${ADMIN_EMAIL_MESSAGE_MAX_LENGTH} characters or fewer.`,
    };

  return { ok: true, value: { subject, message } };
}
