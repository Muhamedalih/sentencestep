import { sendTemplateEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates/welcome";

export interface WelcomeUser {
  email: string;
  displayName: string | null;
}

/**
 * Sends the welcome email once a new account has a real session — called
 * from signUp (immediate-session case, no email confirmation required) and
 * the confirmation callback route (pending-confirmation case). Not gated by
 * email preferences: it's a one-time onboarding message, not a recurring
 * learning email, and preferences can't be set before an account exists
 * anyway. Never throws — a failure here must not break account creation.
 *
 * OFF unless WELCOME_EMAIL_ENABLED=true. It is pure onboarding polish, and on
 * Resend's free plan (100 emails/day for everything) every new account would
 * otherwise cost a second email on top of its confirmation. It also must stay
 * off while "Confirm email" is disabled in Supabase, or it would mail an address
 * nobody has verified.
 */
export async function queueWelcomeEmail(user: WelcomeUser, origin: string): Promise<void> {
  if (process.env.WELCOME_EMAIL_ENABLED !== "true") return;

  try {
    const content = welcomeEmail({ origin, displayName: user.displayName });
    await sendTemplateEmail(user.email, content);
  } catch (error) {
    console.error("[notifications] queueWelcomeEmail failed", error);
  }
}
