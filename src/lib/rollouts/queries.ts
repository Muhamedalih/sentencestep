import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { cache } from "react";

import { isAdmin } from "@/lib/admin/access";
import { ROLLOUT_IDS } from "@/lib/rollouts/catalog";
import type { RolloutId } from "@/lib/rollouts/catalog";
import {
  closedRollouts,
  defaultRolloutConfig,
  evaluateRollouts,
  sanitizeRolloutConfig,
} from "@/lib/rollouts/config";
import type { RolloutConfig } from "@/lib/rollouts/config";
import { ROLLOUT_PREVIEW_COOKIE, verifyRolloutPreview } from "@/lib/rollouts/preview";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

/** Revalidated by saveRolloutAction, so a change shows up at once instead of after the expiry below. */
export const ROLLOUT_CACHE_TAG = "rollouts";

async function readRolloutRows() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("rollouts").select("feature, mode, percent, emails");
  if (error) throw error;
  return data ?? [];
}

/**
 * The stored rows, share-cached across requests: one small table the same for every visitor (the
 * per-visitor answer is worked out afterwards, in getRolloutAccess). The service role reads it because
 * the table has no public policy (it holds the emails of the people being tried on). Throws on a read
 * error so a failure is never cached.
 */
const readRolloutRowsCached = unstable_cache(readRolloutRows, ["rollout-rows"], {
  tags: [ROLLOUT_CACHE_TAG],
  revalidate: 60,
});

/**
 * Who each feature is open to. `fresh` skips the cache — the Permissions page itself must show what
 * is stored right now. Anything that goes wrong (no project linked, the table not created yet, a
 * database error) reads as the safe answer, "Admins only" for everything, never as an error.
 */
export async function getRolloutConfig(options: { fresh?: boolean } = {}): Promise<RolloutConfig> {
  if (!isServiceRoleConfigured()) return defaultRolloutConfig();
  try {
    return sanitizeRolloutConfig(
      options.fresh ? await readRolloutRows() : await readRolloutRowsCached(),
    );
  } catch (error) {
    console.error("[rollouts] couldn't read the permissions; everything stays admins-only", error);
    return defaultRolloutConfig();
  }
}

async function previewActive(): Promise<boolean> {
  try {
    return verifyRolloutPreview((await cookies()).get(ROLLOUT_PREVIEW_COOKIE)?.value, Date.now());
  } catch {
    // Outside a request (a cron, a build) there is no browser to have a cookie.
    return false;
  }
}

/** Whether the rollouts table exists and can be read — the Permissions page says so when it can't (the migration is not applied yet). */
export async function rolloutsTableReady(): Promise<boolean> {
  if (!isServiceRoleConfigured()) return false;
  try {
    await readRolloutRows();
    return true;
  } catch {
    return false;
  }
}

/** Whether an admin switched preview on for this browser (see preview.ts). */
export async function isRolloutPreviewActive(): Promise<boolean> {
  return previewActive();
}

/**
 * What THIS visitor gets from the Permissions page: one yes/no per feature, already worked out
 * against who is asking (an admin, a listed email, a guest, a browser an admin switched preview on
 * for). Plain booleans, safe to hand to Client Components — the emails never leave the server. Never
 * throws: when anything fails everything is closed. cache()'d per request.
 */
export const getRolloutAccess = cache(async (): Promise<Record<RolloutId, boolean>> => {
  try {
    // Local development only (no Supabase project linked): the same opt-in switch the Features page
    // has, so the screens can be exercised offline. Hard-gated to non-production on every read.
    if (
      !isSupabaseConfigured() &&
      process.env.NODE_ENV !== "production" &&
      process.env.FEATURES_DEV_ALL_ON === "true"
    ) {
      const open = closedRollouts();
      for (const id of ROLLOUT_IDS) open[id] = true;
      return open;
    }
    const [config, user, admin, preview] = await Promise.all([
      getRolloutConfig(),
      getCurrentUser(),
      isAdmin().catch(() => false),
      previewActive(),
    ]);
    return evaluateRollouts(config, {
      isAdmin: admin,
      email: user?.email || null,
      userId: user?.id ?? null,
      preview,
    });
  } catch (error) {
    console.error("[rollouts] getRolloutAccess failed", error);
    return closedRollouts();
  }
});
