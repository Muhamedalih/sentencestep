import { alertAdmins } from "@/lib/admin/alert-admins";
import type { InboundEmailRow } from "@/lib/email/inbound/parse";
import { inboxAlertEmail, senderLabel } from "@/lib/email/templates/inbox-alert";
import { getSiteUrl } from "@/lib/site-url";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * More than this many messages stored within the window means the receiving
 * address is being flooded (it is public to anyone a learner forwards to, and
 * spammers find such addresses). The messages are still stored and still
 * counted on the Inbox badge, but alerts stop so the admins' own inboxes —
 * and our sending reputation — aren't flooded along with it.
 */
export const ALERT_BURST_LIMIT = 10;
const ALERT_BURST_WINDOW_MINUTES = 10;

const PUSH_BODY_LENGTH = 120;

async function isBurst(): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - ALERT_BURST_WINDOW_MINUTES * 60_000).toISOString();
  const { count, error } = await supabase
    .from("inbound_emails")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (error) throw error;
  return (count ?? 0) > ALERT_BURST_LIMIT;
}

/**
 * Tells every admin that a new reply is waiting in Admin > Inbox: an email to
 * each admin account, plus a web-push to any admin device that enabled push
 * in Settings (see alertAdmins for how the two channels behave).
 *
 * Never throws: the message is already stored by the time this runs, and a
 * failed alert must not make the webhook report a failure (the provider would
 * only retry, find the row, and skip).
 */
export async function notifyAdminsOfInboundEmail(row: InboundEmailRow): Promise<void> {
  try {
    if (await isBurst()) {
      console.warn("[inbound-email] alert skipped — burst of messages in the last few minutes");
      return;
    }

    const content = inboxAlertEmail({
      origin: getSiteUrl(),
      fromEmail: row.from_email,
      fromName: row.from_name,
      subject: row.subject,
      bodyText: row.body_text,
    });
    const summary = row.subject.trim() || row.body_text.replace(/\s+/g, " ").trim();

    await alertAdmins(
      {
        email: content,
        push: {
          title: "New reply in your Inbox",
          body: `${senderLabel(row.from_email, row.from_name)}: ${summary}`.slice(
            0,
            PUSH_BODY_LENGTH,
          ),
          url: "/admin/inbox",
        },
      },
      { logTag: "inbound-email" },
    );
  } catch (error) {
    console.error("[inbound-email] couldn't notify admins", error);
  }
}
