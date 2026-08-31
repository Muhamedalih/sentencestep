import { createClient } from "@/lib/supabase/server";

export interface EmailPreferences {
  learningReminders: boolean;
  progressEmails: boolean;
  timezone: string | null;
}

const DEFAULT_PREFERENCES: EmailPreferences = {
  learningReminders: true,
  progressEmails: true,
  timezone: null,
};

/** RLS-scoped to the row owner — safe to call with the normal session client, unlike notification_events. */
export async function getEmailPreferences(userId: string): Promise<EmailPreferences> {
  const supabase = await createClient();
  const [{ data: prefs }, { data: profile }] = await Promise.all([
    supabase.from("email_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
  ]);

  return {
    learningReminders: prefs?.learning_reminders ?? DEFAULT_PREFERENCES.learningReminders,
    progressEmails: prefs?.progress_emails ?? DEFAULT_PREFERENCES.progressEmails,
    timezone: profile?.timezone ?? null,
  };
}

export async function updateEmailPreferences(
  userId: string,
  updates: { learningReminders: boolean; progressEmails: boolean; timezone?: string | null },
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("email_preferences").upsert(
    {
      user_id: userId,
      learning_reminders: updates.learningReminders,
      progress_emails: updates.progressEmails,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;

  if (updates.timezone) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ timezone: updates.timezone, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (profileError) throw profileError;
  }
}
