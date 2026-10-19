import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Stops the emails a learner can opt out of with one click: the learning reminders and the offers.
 * Progress emails are a separate choice and stay as they were. Only called after the signed link
 * was verified (see unsubscribe-token.ts).
 */
export async function applyUnsubscribe(userId: string): Promise<void> {
  const { error } = await createServiceRoleClient().from("email_preferences").upsert(
    {
      user_id: userId,
      learning_reminders: false,
      offer_emails: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/** The language of a learner's profile for the page they land on, English when unknown. */
export async function unsubscribeLanguage(userId: string): Promise<"ar" | "es" | "tr" | "en"> {
  try {
    const { data } = await createServiceRoleClient()
      .from("profiles")
      .select("preferred_language")
      .eq("id", userId)
      .maybeSingle();
    const value = data?.preferred_language;
    return value === "ar" || value === "es" || value === "tr" ? value : "en";
  } catch {
    return "en";
  }
}
