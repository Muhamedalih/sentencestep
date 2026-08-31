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
