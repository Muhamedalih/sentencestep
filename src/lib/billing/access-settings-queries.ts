import { cache } from "react";

import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AccessSettings {
  freeForAll: boolean;
}

const DEFAULT_ACCESS_SETTINGS: AccessSettings = { freeForAll: false };

/**
 * The one admin-controlled "everything is free right now" row — read
 * publicly (see 20250228000000_free_for_all_access.sql), consumed by
 * getAccessState() so every premium gate in the app shares one source of
 * truth. cache()'d per request, matching getCurrentUser()'s convention, so
 * a page that calls hasPremiumAccess() more than once doesn't pay for it
 * twice.
 */
export const getAccessSettings = cache(async (): Promise<AccessSettings> => {
  if (!isSupabaseConfigured()) return DEFAULT_ACCESS_SETTINGS;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("access_settings")
    .select("free_for_all")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_ACCESS_SETTINGS;
  return { freeForAll: data.free_for_all };
});
