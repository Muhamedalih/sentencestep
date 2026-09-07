import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_ONBOARDING_CARD_SETTINGS,
  type OnboardingCardSettings,
} from "@/lib/admin/onboarding-card-settings";

/**
 * Reads the one admin-configured onboarding-card row. Called both from the
 * admin onboarding-card page (to show the current image/title) and from
 * OnboardingIntroCard, the get-started flow's third step — deliberately a
 * plain public-client read (no server round trip needed, same "publicly
 * readable" RLS policy as typing_sound_settings) rather than fetched from
 * the root layout, which stays free of any DB query on every page load (see
 * getLocale's own doc comment) since this card only ever matters for the
 * rare first-time-visitor moment.
 */
export async function getOnboardingCardSettings(): Promise<OnboardingCardSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_ONBOARDING_CARD_SETTINGS;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("onboarding_intro_card")
    .select("image_url, title")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_ONBOARDING_CARD_SETTINGS;

  return {
    imageUrl: data.image_url,
    title: data.title || DEFAULT_ONBOARDING_CARD_SETTINGS.title,
  };
}

/**
 * Reads the shared illustration the three OPENING_LESSON_IDS lessons carry
 * (see uploadOpeningLessonImage in onboarding-card-actions.ts) — only
 * onboarding-beginner's own row is queried since a shared upload always
 * writes the identical URL to all three, so any one of them is
 * representative for showing the admin what's currently set.
 */
export async function getOpeningLessonIllustration(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("illustration_url")
    .eq("id", "onboarding-beginner")
    .maybeSingle();

  if (error || !data) return null;
  return data.illustration_url;
}

/**
 * Reads the shared narration voice the three OPENING_LESSON_IDS lessons
 * carry (see setOpeningLessonVoice in onboarding-card-actions.ts) — only
 * onboarding-beginner's own row is queried since a shared change always
 * writes the identical voice_id to all three, so any one of them is
 * representative for showing the admin what's currently set.
 */
export async function getOpeningLessonVoiceId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("voice_id")
    .eq("id", "onboarding-beginner")
    .maybeSingle();

  if (error || !data) return null;
  return data.voice_id;
}
