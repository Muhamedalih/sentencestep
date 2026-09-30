import { unstable_cache } from "next/cache";
import { cache } from "react";

import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import {
  defaultFeatureConfig,
  disabledFeatures,
  resolveFeatures,
  sanitizeFeatureConfig,
} from "@/lib/features/config";
import type { EffectiveFeatures, FeatureConfig } from "@/lib/features/config";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";

/**
 * The raw feature_settings document, share-cached across requests. It is one
 * admin-edited row that is identical for every visitor (the per-visitor
 * resolution happens afterwards, in getEffectiveFeatures), and it used to cost
 * a full database round trip on EVERY /learn request — the first link in the
 * chain that decides when Home's engagement cards can even start loading.
 * Saving the settings revalidates the "feature-settings" tag (see
 * saveFeatureConfig), so an admin's change still shows up immediately; the
 * short expiry is only a backstop. createPublicClient, not createClient: this
 * runs inside unstable_cache, which cannot read cookies (see fetchLessonNav).
 * Throws on a read error so a failure is never cached.
 */
const readFeatureConfigRow = unstable_cache(
  async (): Promise<unknown> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("feature_settings")
      .select("config")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return data?.config ?? null;
  },
  ["feature-settings-row"],
  { tags: ["feature-settings"], revalidate: 60 },
);

/**
 * The raw, sanitized admin config (see feature_settings). cache()'d per
 * request like getAccessSettings — a page and its layout both asking costs
 * one read (itself share-cached across requests, see readFeatureConfigRow).
 * Falls back to "everything off" when Supabase isn't configured, the
 * migration hasn't been applied to this environment yet, or the read
 * fails: a missing/broken settings row must never take a learner page down,
 * it just means none of these optional features render.
 */
export const getFeatureConfig = cache(async (): Promise<FeatureConfig> => {
  if (!isSupabaseConfigured()) return defaultFeatureConfig();
  try {
    const raw = await readFeatureConfigRow();
    return raw ? sanitizeFeatureConfig(raw) : defaultFeatureConfig();
  } catch {
    return defaultFeatureConfig();
  }
});

/**
 * What the CURRENT visitor actually gets — config resolved against whether
 * they're signed in, an admin (for the "admin preview" state), and premium
 * (for the premium-only switch). The one call every server entry point makes
 * (LearnLayout for the client provider; Server Actions to re-check a feature
 * is really open before doing work for it). cache()'d per request.
 */
export const getEffectiveFeatures = cache(async (): Promise<EffectiveFeatures> => {
  if (!isSupabaseConfigured()) {
    // Local development only: with no Supabase project linked there is no
    // settings row to read, so this opt-in env var switches every feature on
    // (as a guest — the account-only ones still need a real session) purely
    // so the lesson-session features can be exercised offline. Hard-gated to
    // non-production on every read, same convention as the dev-admin and
    // dev-plan cookies.
    if (process.env.NODE_ENV !== "production" && process.env.FEATURES_DEV_ALL_ON === "true") {
      const config = defaultFeatureConfig();
      for (const entry of Object.values(config.features)) entry.state = "on";
      return resolveFeatures(config, { signedIn: false, isAdmin: false, isPremium: false });
    }
    return disabledFeatures(false);
  }
  try {
    const config = await getFeatureConfig();
    const entries = Object.values(config.features);
    // The shipped default is "everything off": answer straight away instead of
    // making every /learn page pay for role and subscription lookups whose
    // result nothing would read.
    if (entries.every((entry) => entry.state === "off")) {
      return disabledFeatures((await getCurrentUser()) !== null);
    }
    // Likewise only look up what the switches can actually depend on: the
    // admin role for a preview (or the admin bypass of premium-only), the
    // subscription for premium-only.
    const needsPremium = entries.some((entry) => entry.state !== "off" && entry.premiumOnly);
    const needsAdmin = needsPremium || entries.some((entry) => entry.state === "admin");
    const [user, admin, premium] = await Promise.all([
      getCurrentUser(),
      needsAdmin ? isAdmin() : false,
      needsPremium ? hasPremiumAccess() : false,
    ]);
    return resolveFeatures(config, {
      signedIn: user !== null,
      isAdmin: admin,
      isPremium: premium,
    });
  } catch (error) {
    console.error("[features] getEffectiveFeatures failed", error);
    return disabledFeatures(false);
  }
});
