"use server";

import { getCurrentUser } from "@/lib/supabase/auth";
import {
  deletePushSubscription,
  savePushSubscription,
  type PushSubscriptionInput,
} from "@/lib/push/subscriptions";

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
