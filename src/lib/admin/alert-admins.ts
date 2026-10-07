import { sendTemplateEmail } from "@/lib/email/send";
import type { EmailContent } from "@/lib/email/templates/layout";
import { isPushConfigured, PushSubscriptionGoneError, sendPushNotification } from "@/lib/push/send";
import type { PushPayload } from "@/lib/push/send";
import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsForUsers,
} from "@/lib/push/subscriptions";
import type { PushSubscriptionRecord } from "@/lib/push/subscriptions";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface AdminContact {
  id: string;
  email: string;
}

/** What to tell the admins: an email to each, and (when a push body is given) a web push to each device that enabled push. */
export interface AdminAlert {
  email: EmailContent;
  push: PushPayload | null;
}

export interface AdminAlertDeps {
  listAdmins(): Promise<AdminContact[]>;
  sendEmail(to: string, content: EmailContent): Promise<unknown>;
  isPushConfigured(): boolean;
  getSubscriptions(userIds: string[]): Promise<Map<string, PushSubscriptionRecord[]>>;
  sendPush(subscription: PushSubscriptionRecord, payload: PushPayload): Promise<void>;
  deleteSubscription(endpoint: string): Promise<void>;
}

export async function listAdminContacts(): Promise<AdminContact[]> {
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

const realDeps: AdminAlertDeps = {
  listAdmins: listAdminContacts,
  // Alert emails carry NO Reply-To, so replying to one (or an auto-responder
  // answering it) can't land back in the Inbox and raise another alert.
  sendEmail: (to, content) => sendTemplateEmail(to, content, { replyTo: null }),
  isPushConfigured,
  getSubscriptions: getPushSubscriptionsForUsers,
  sendPush: sendPushNotification,
  deleteSubscription: deletePushSubscriptionByEndpoint,
};

/**
 * Tells every admin something needs them: an email to each admin account, plus
 * a web push to any admin device that enabled push in Settings (a no-op when
 * push isn't configured or nobody subscribed). The two channels are
 * independent, so one failing never blocks the other, and this never throws —
 * the thing being reported has already happened and been stored, and a failed
 * alert must not turn that into an error for whoever triggered it.
 */
export async function alertAdmins(
  alert: AdminAlert,
  options: { logTag: string; deps?: AdminAlertDeps },
): Promise<void> {
  const { logTag } = options;
  const deps = options.deps ?? realDeps;

  try {
    const admins = await deps.listAdmins();
    if (admins.length === 0) return;

    const emailResults = await Promise.allSettled(
      admins.map((admin) => deps.sendEmail(admin.email, alert.email)),
    );
    for (const result of emailResults) {
      if (result.status === "rejected")
        console.error(`[${logTag}] alert email failed`, result.reason);
    }

    if (!alert.push || !deps.isPushConfigured()) return;

    const subscriptionsByAdmin = await deps.getSubscriptions(admins.map((admin) => admin.id));
    for (const subscriptions of subscriptionsByAdmin.values()) {
      for (const subscription of subscriptions) {
        try {
          await deps.sendPush(subscription, alert.push);
        } catch (error) {
          if (error instanceof PushSubscriptionGoneError) {
            await deps.deleteSubscription(subscription.endpoint).catch(() => undefined);
          } else {
            console.error(`[${logTag}] alert push failed`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error(`[${logTag}] couldn't alert admins`, error);
  }
}

/** Resolves when `work` does, or after `ms`, whichever is first — so a slow provider can never hold up the request that raised the alert. Never rejects. */
export async function withinTime(work: Promise<unknown>, ms: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, ms);
  });
  try {
    await Promise.race([
      work.then(
        () => undefined,
        () => undefined,
      ),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
