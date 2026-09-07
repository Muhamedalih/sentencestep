"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

export interface ProfileActionState {
  error?: string;
  success?: string;
}

/** Settings' daily-goal control — validated to the same 1–50 range as the DB check constraint, so a rejected value never reaches Postgres as an opaque 500. */
export async function updateDailyGoalAction(
  _prevState: ProfileActionState | null,
  formData: FormData,
): Promise<ProfileActionState> {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  const raw = Number(formData.get("dailyGoal"));
  if (!Number.isInteger(raw) || raw < 1 || raw > 50) {
    return { error: t.settings.dailyGoalInvalid };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return { error: t.auth.errors.genericError };

  const { error } = await supabase
    .from("profiles")
    .update({ daily_goal: raw })
    .eq("id", claims.sub);
  if (error) return { error: t.settings.dailyGoalError };

  revalidatePath("/learn/settings");
  revalidatePath("/learn");
  return { success: t.settings.dailyGoalSaved };
}

/**
 * The direct (non-form) counterpart used by StartingLevelOnboarding, since
 * the picker's tap-a-tier interaction has no form to submit — persists
 * optimistically rather than showing its own loading/error state for a
 * single one-time choice.
 */
export async function setStartingLevelAction(level: number): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return;

  const { error } = await supabase
    .from("profiles")
    .update({ starting_level: level })
    .eq("id", claims.sub);
  if (error) throw error;
}

/** Lets a learner change their starting level later from Settings — same column StartingLevelOnboarding writes on first visit (see its doc comment for the null/0/N meaning). */
export async function updateStartingLevelAction(
  _prevState: ProfileActionState | null,
  formData: FormData,
): Promise<ProfileActionState> {
  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  const raw = Number(formData.get("startingLevel"));
  if (!Number.isInteger(raw) || raw < 0) {
    return { error: t.settings.startingLevelError };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return { error: t.auth.errors.genericError };

  const { error } = await supabase
    .from("profiles")
    .update({ starting_level: raw })
    .eq("id", claims.sub);
  if (error) return { error: t.settings.startingLevelError };

  revalidatePath("/learn/settings");
  revalidatePath("/learn");
  revalidatePath("/learn/normal");
  return { success: t.settings.startingLevelSaved };
}
