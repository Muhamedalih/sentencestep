import type { InboundEmailRow } from "@/lib/email/inbound/parse";
import { sendTemplateEmail } from "@/lib/email/send";
import { inboxAlertEmail, senderLabel } from "@/lib/email/templates/inbox-alert";
import { isPushConfigured, PushSubscriptionGoneError, sendPushNotification } from "@/lib/push/send";
import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsForUsers,
} from "@/lib/push/subscriptions";
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

interface AdminContact {
  id: string;
  email: string;
}

async function listAdminContacts(): Promise<AdminContact[]> {
  const supabase = createServiceRoleClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  if (error) throw error;

  const contacts = await Promise.all(
    (profiles ?? []).map(async ({ id }): Promise<AdminContact | null> => {
      const { data } = await supabase.auth.admin.getUserById(id);
      return data.user?.email ? { id, email: data.user.email } : null;
    }),
  );
  return contacts.filter((contact): contact is AdminContact => contact !== null);
}

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
 * in Settings (a no-op when push isn't configured or nobody subscribed). The
 * two channels are independent — one failing never blocks the other.
 *
 * Never throws: the message is already stored by the time this runs, and a
 * failed alert must not make the webhook report a failure (the provider would
 * only retry, find the row, and skip). Alert emails are sent with NO Reply-To
 * (`replyTo: null`), so replying to an alert — or an auto-responder answering
 * it — can't land back in the Inbox and trigger another alert.
 */
export async function notifyAdminsOfInboundEmail(row: InboundEmailRow): Promise<void> {
  try {
    if (await isBurst()) {
      console.warn("[inbound-email] alert skipped — burst of messages in the last few minutes");
      return;
    }

    const admins = await listAdminContacts();
    if (admins.length === 0) return;

    const origin = getSiteUrl();
    const content = inboxAlertEmail({
      origin,
      fromEmail: row.from_email,
      fromName: row.from_name,
      subject: row.subject,
      bodyText: row.body_text,
    });

    const emailResults = await Promise.allSettled(
      admins.map((admin) => sendTemplateEmail(admin.email, content, { replyTo: null })),
    );
    for (const result of emailResults) {
      if (result.status === "rejected") {
        console.error("[inbound-email] alert email failed", result.reason);
      }
    }

    if (!isPushConfigured()) return;

    const subscriptionsByAdmin = await getPushSubscriptionsForUsers(
      admins.map((admin) => admin.id),
    );
    const summary = row.subject.trim() || row.body_text.replace(/\s+/g, " ").trim();
    const body = `${senderLabel(row.from_email, row.from_name)}: ${summary}`.slice(
      0,
      PUSH_BODY_LENGTH,
    );

    for (const subscriptions of subscriptionsByAdmin.values()) {
      for (const subscription of subscriptions) {
        try {
          await sendPushNotification(subscription, {
            title: "New reply in your Inbox",
            body,
            url: "/admin/inbox",
          });
        } catch (error) {
          if (error instanceof PushSubscriptionGoneError) {
            await deletePushSubscriptionByEndpoint(subscription.endpoint).catch(() => undefined);
          } else {
            console.error("[inbound-email] alert push failed", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("[inbound-email] couldn't notify admins", error);
  }
}
