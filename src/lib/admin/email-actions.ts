"use server";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { isPlausibleEmail, validateAdminEmailInput } from "@/lib/admin/email-validation";
import { findUserByEmail } from "@/lib/admin/users-lookup";
import { sendTemplateEmail } from "@/lib/email/send";
import { adminMessageEmail } from "@/lib/email/templates/admin-message";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";

export interface AdminEmailActionResult {
  error?: string;
  success?: string;
}

/**
 * Sends the email and maps the three honest outcomes — sent, no provider
 * configured (send.ts returns "queued", which is NOT sent), or a provider
 * failure — to a result the admin can act on. Returns the provider's message
 * id on success so the caller can put it in the audit log.
 */
async function deliver(
  to: string,
  subject: string,
  message: string,
): Promise<{ error: string } | { messageId: string }> {
  try {
    const content = adminMessageEmail({ origin: getSiteUrl(), subject, message });
    const result = await sendTemplateEmail(to, content);
    if (result.status === "queued") {
      return {
        error:
          "Nothing was sent — no email provider is configured. Set EMAIL_PROVIDER_API_KEY and EMAIL_FROM_ADDRESS.",
      };
    }
    return { messageId: result.providerMessageId };
  } catch (error) {
    console.error("[admin-email] send failed", error);
    return { error: "The email provider rejected the message. Please try again." };
  }
}

/**
 * Emails a registered user, addressed by email. The recipient must already
 * have a SentenceStep account — this is a support tool, not a way to send
 * mail from the site's address to arbitrary people, so an unknown address is
 * refused rather than sent.
 */
export async function sendEmailToUser(
  email: string,
  subject: string,
  message: string,
): Promise<AdminEmailActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (!isServiceRoleConfigured())
    return { error: "Service role key isn't configured for this environment." };

  const normalizedEmail = email.trim().toLowerCase();
  if (!isPlausibleEmail(normalizedEmail)) return { error: "Enter a valid email address." };

  const validation = validateAdminEmailInput({ subject, message });
  if (!validation.ok) return { error: validation.error };

  const found = await findUserByEmail(normalizedEmail);
  if (found.status === "error")
    return { error: "Couldn't search for that user. Please try again." };
  if (found.status === "not_found") return { error: "No account found with that email." };

  const sent = await deliver(found.email, validation.value.subject, validation.value.message);
  if ("error" in sent) return { error: sent.error };

  void logAdminAction("email.sent", "profile", found.id, {
    recipient: found.email,
    subject: validation.value.subject,
    providerMessageId: sent.messageId,
  });
  return { success: `Email sent to ${found.email}.` };
}

/**
 * Replies by email to whoever filed a problem report. The recipient is read
 * from the report row on the server — never taken from the client — so this
 * can only ever reach someone who actually wrote in.
 */
export async function replyToProblemReport(
  reportId: string,
  subject: string,
  message: string,
): Promise<AdminEmailActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const validation = validateAdminEmailInput({ subject, message });
  if (!validation.ok) return { error: validation.error };

  const supabase = await createClient();
  const { data: report, error } = await supabase
    .from("problem_reports")
    .select("user_email")
    .eq("id", reportId)
    .maybeSingle();
  if (error) return { error: "Couldn't load this report. Please try again." };
  if (!report) return { error: "This report no longer exists." };

  const sent = await deliver(report.user_email, validation.value.subject, validation.value.message);
  if ("error" in sent) return { error: sent.error };

  void logAdminAction("report.replied", "problem_report", reportId, {
    recipient: report.user_email,
    subject: validation.value.subject,
    providerMessageId: sent.messageId,
  });
  return { success: `Reply sent to ${report.user_email}.` };
}
