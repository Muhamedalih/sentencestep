"use server";

import { getCurrentUser } from "@/lib/supabase/auth";
import {
  deletePushSubscription,
  getOwnPushSubscriptions,
  savePushSubscription,
  type PushSubscriptionInput,
} from "@/lib/push/subscriptions";
import { PushSubscriptionGoneError, sendPushNotification } from "@/lib/push/send";

export async function savePushSubscriptionAction(
  subscription: PushSubscriptionInput,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  try {
    await savePushSubscription(user.id, subscription);
    return {};
  } catch {
    return { error: "Couldn't save your subscription. Please try again." };
  }
}

export async function deletePushSubscriptionAction(endpoint: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  try {
    await deletePushSubscription(user.id, endpoint);
    return {};
  } catch {
    return { error: "Couldn't disable notifications. Please try again." };
  }
}

/**
 * Lets a learner verify the whole pipeline (permission → subscription row →
 * a real push arriving) immediately from Settings, instead of only finding
 * out it works after 3 real days of inactivity (see
 * src/app/api/cron/inactive-learners-push). Sends to every browser/device
 * this learner has subscribed, same as the real cron send, and cleans up any
 * subscription the push service reports as gone exactly like that cron does.
 */
export async function sendTestPushNotificationAction(): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  let subscriptions;
  try {
    subscriptions = await getOwnPushSubscriptions(user.id);
  } catch {
    return { error: "Couldn't send a test notification. Please try again." };
  }

  if (subscriptions.length === 0) {
    return { error: "Enable notifications first." };
  }

  let sentToAny = false;
  for (const subscription of subscriptions) {
    try {
      await sendPushNotification(subscription, {
        title: "SentenceStep",
        body: "This is a test notification — if you can see this, notifications are working.",
        url: "/learn",
      });
      sentToAny = true;
    } catch (error) {
      if (error instanceof PushSubscriptionGoneError) {
        await deletePushSubscription(user.id, subscription.endpoint);
        continue;
      }
      // A real provider error (network hiccup, transient failure) for one
      // device shouldn't stop the test from reaching the learner's other
      // devices — matches the cron route's own per-subscription isolation.
      console.error("[push] sendTestPushNotificationAction failed", { userId: user.id, error });
    }
  }

  return sentToAny ? {} : { error: "Couldn't send a test notification. Please try again." };
}
