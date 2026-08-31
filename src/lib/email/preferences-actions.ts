"use server";

import { revalidatePath } from "next/cache";

import { updateEmailPreferences } from "@/lib/email/preferences";
import { getCurrentUser } from "@/lib/supabase/auth";

export interface PreferencesActionState {
  error?: string;
  success?: string;
}

export async function updateEmailPreferencesAction(
  _prevState: PreferencesActionState | null,
  formData: FormData,
): Promise<PreferencesActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const learningReminders = formData.get("learningReminders") === "on";
  const progressEmails = formData.get("progressEmails") === "on";
  const timezone = formData.get("timezone");

  try {
    await updateEmailPreferences(user.id, {
      learningReminders,
      progressEmails,
      timezone: typeof timezone === "string" && timezone ? timezone : undefined,
    });
  } catch {
    return { error: "Couldn't save your preferences. Please try again." };
  }

  revalidatePath("/learn/settings");
  return { success: "Preferences saved." };
}
