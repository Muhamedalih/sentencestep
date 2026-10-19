/**
 * The boundary a real email provider (Resend, Postmark, SES, or whichever
 * one is eventually chosen) implements. The rest of the app — templates,
 * notification triggers, the settings page — only ever calls
 * sendTemplateEmail() in send.ts, never a provider's SDK directly. Adding a
 * provider means writing one adapter that implements this and registering
 * it in provider-registry.ts.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  /**
   * Overrides the provider's default Reply-To for this one message: a string
   * replaces it, `null` sends with none, `undefined` keeps the default.
   * Automated notices to admins use `null` so that replying to (or an
   * auto-responder answering) a notice can't loop back into the Inbox.
   */
  replyTo?: string | null;
  /** Extra message headers, e.g. List-Unsubscribe and List-Unsubscribe-Post for one-click unsubscribe. */
  headers?: Record<string, string>;
  /**
   * How much it matters that this message goes out: "important" (a payment, a receipt, a support
   * reply, an alert) or "bulk" (a reminder or a milestone). Only the routing provider reads it, to
   * keep the free Resend quota for the important ones; the single-provider adapters ignore it.
   */
  priority?: "important" | "bulk";
}

export interface SendEmailResult {
  /**
   * What we actually know. "sent" means the provider's API accepted the
   * request — it is NOT the same as delivered, and this layer must never
   * claim delivery, since only a provider webhook (not built yet) could
   * confirm that.
   */
  status: "sent";
  providerMessageId: string;
}

export interface EmailProvider {
  readonly name: string;
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}
