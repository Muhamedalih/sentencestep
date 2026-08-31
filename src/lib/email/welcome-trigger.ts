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
 */
export async function queueWelcomeEmail(user: WelcomeUser, origin: string): Promise<void> {
  try {
    const content = welcomeEmail({ origin, displayName: user.displayName });
    await sendTemplateEmail(user.email, content);
  } catch (error) {
    console.error("[notifications] queueWelcomeEmail failed", error);
  }
}
