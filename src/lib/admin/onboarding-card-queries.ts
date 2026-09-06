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
