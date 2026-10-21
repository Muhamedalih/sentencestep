"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { ROLLOUT_IDS, ROLLOUTS } from "@/lib/rollouts/catalog";
import type { RolloutId } from "@/lib/rollouts/catalog";
import { MAX_ROLLOUT_EMAILS, isRolloutMode, parseEmailList } from "@/lib/rollouts/config";
import {
  ROLLOUT_PREVIEW_COOKIE,
  ROLLOUT_PREVIEW_DAYS,
  signRolloutPreview,
} from "@/lib/rollouts/preview";
import { ROLLOUT_CACHE_TAG } from "@/lib/rollouts/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

/**
 * Saves who ONE feature is open to, from /admin/permissions. Everything arrives as client input (a
 * Server Action is reachable as a direct POST), so each field is re-validated here: the feature must
 * be one in the catalog, the mode one of the three (a feature aimed at first-time visitors cannot use
 * a list of emails), the percentage a whole number from 1 to 100, and every email must be a real
 * address — a list with a typo is refused whole, naming what is wrong, rather than saved half-right.
 * Admin-only here and again by row-level security. The change is written to the audit log (how many
 * people, never who).
 */
export async function saveRolloutAction(input: {
  feature: string;
  mode: string;
  percent: number;
  emailsText: string;
}): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (!isServiceRoleConfigured()) return { error: "No Supabase project is linked." };

  const id = ROLLOUT_IDS.find((candidate) => candidate === input.feature) as RolloutId | undefined;
  if (!id) return { error: "Unknown feature." };
  if (!isRolloutMode(input.mode)) return { error: "Unknown access level." };
  const mode = input.mode;
  if (mode === "emails" && ROLLOUTS[id].audience === "visitor") {
    return {
      error:
        "First-time visitors have no email yet, so this one can't be given to specific people.",
    };
  }

  const percent = Number(input.percent);
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
    return { error: "The share of visitors must be a whole number from 1 to 100." };
  }

  const parsed = parseEmailList(typeof input.emailsText === "string" ? input.emailsText : "");
  if (parsed.invalid.length > 0) {
    return {
      error: `These are not email addresses: ${parsed.invalid.slice(0, 5).join(", ")}${
        parsed.invalid.length > 5 ? ` and ${parsed.invalid.length - 5} more` : ""
      }. Nothing was saved.`,
    };
  }
  if (parsed.emails.length > MAX_ROLLOUT_EMAILS) {
    return { error: `At most ${MAX_ROLLOUT_EMAILS} people per feature.` };
  }
  if (mode === "emails" && parsed.emails.length === 0) {
    return { error: "Add at least one email, or choose Admins only." };
  }

  const user = await getCurrentUser();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("rollouts").upsert(
    {
      feature: id,
      mode,
      percent,
      emails: parsed.emails,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    },
    { onConflict: "feature" },
  );
  if (error) {
    console.error("[rollouts] saveRolloutAction failed", error);
    return {
      error:
        "Couldn't save. If this is the first time, the rollouts table may not exist yet (migration 20250346000000).",
    };
  }

  void logAdminAction("rollout.updated", "rollout", id, {
    mode,
    percent,
    people: parsed.emails.length,
  });
  // The share-cached read (see readRolloutRowsCached) must not serve the old answer, and every
  // /learn page's resolved features must be recomputed.
  revalidateTag(ROLLOUT_CACHE_TAG);
  revalidatePath("/learn", "layout");
  revalidatePath("/admin/permissions");
  return { success: `${ROLLOUTS[id].title} saved.` };
}

/**
 * Turns "preview in this browser" on or off (see preview.ts): with it on, THIS browser gets every
 * feature, signed in or out, for a week. Admin-only, so the signed cookie can only ever be handed to
 * an admin's own browser.
 */
export async function setRolloutPreviewAction(enabled: boolean): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const cookieStore = await cookies();
  if (!enabled) {
    cookieStore.delete(ROLLOUT_PREVIEW_COOKIE);
    revalidatePath("/learn", "layout");
    revalidatePath("/admin/permissions");
    return { success: "Preview is off in this browser." };
  }

  const expiresAt = Date.now() + ROLLOUT_PREVIEW_DAYS * 86_400_000;
  const value = signRolloutPreview(expiresAt);
  if (!value) return { error: "Couldn't start the preview: no signing key is set on the server." };
  cookieStore.set(ROLLOUT_PREVIEW_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
  revalidatePath("/learn", "layout");
  revalidatePath("/admin/permissions");
  return { success: `Preview is on in this browser for ${ROLLOUT_PREVIEW_DAYS} days.` };
}
