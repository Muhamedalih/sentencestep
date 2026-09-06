"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { ONBOARDING_CARD_TITLE_MAX_LENGTH } from "@/lib/admin/onboarding-card-settings";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Same recovery-from-public-URL approach as content-actions.ts's illustrationPathFromUrl, for the same reason: the onboarding-card bucket has no list/select policy, only insert/update/delete, so the current row's own image_url is the only reliable way to find the file to clean up. */
function onboardingCardPathFromUrl(url: string): string | null {
  const marker = "/object/public/onboarding-card/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

/**
 * Saves the admin-authored headline shown on the get-started flow's third
 * step (see OnboardingIntroCard) — a plain global setting, gated on full
 * admin like typing sound / color settings / fonts, not the narrower
 * editor-or-admin content-authoring tier.
 */
export async function saveOnboardingCardTitle(title: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const trimmed = title.trim();
  if (!trimmed) return { error: "Title can't be empty." };
  if (trimmed.length > ONBOARDING_CARD_TITLE_MAX_LENGTH) {
    return { error: `Title must be ${ONBOARDING_CARD_TITLE_MAX_LENGTH} characters or fewer.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("onboarding_intro_card")
    .update({ title: trimmed, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: "Couldn't save the title. Please try again." };

  void logAdminAction("onboarding_intro_card.title_updated", "onboarding_intro_card", null);
  revalidatePath("/admin/onboarding-card");
  return { success: "Title saved." };
}

/** Uploads the card's cover image — same shape as uploadLessonImage in content-actions.ts, just keyed to the one singleton row instead of a lesson id. */
export async function uploadOnboardingCardImage(
  formData: FormData,
): Promise<ActionResult & { url?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be smaller than 5MB." };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("onboarding_intro_card")
    .select("image_url")
    .eq("id", 1)
    .maybeSingle();
  const previousPath = current?.image_url ? onboardingCardPathFromUrl(current.image_url) : null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("onboarding-card")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("[admin] uploadOnboardingCardImage: Storage upload failed", {
      path,
      code: uploadError.name,
      message: uploadError.message,
    });
    return { error: "Couldn't upload the image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("onboarding-card").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("onboarding_intro_card")
    .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (updateError) {
    console.error("[admin] uploadOnboardingCardImage: row update failed", {
      code: updateError.code,
      message: updateError.message,
    });
    return { error: "Image uploaded but couldn't be saved. Please try again." };
  }

  if (previousPath) {
    const { error: removeError } = await supabase.storage
      .from("onboarding-card")
      .remove([previousPath]);
    if (removeError) {
      console.error("[admin] uploadOnboardingCardImage: cleanup of previous image failed", {
        path: previousPath,
        message: removeError.message,
      });
    }
  }

  void logAdminAction("onboarding_intro_card.image_updated", "onboarding_intro_card", null);
  revalidatePath("/admin/onboarding-card");
  return { success: "Image updated.", url: publicUrl };
}

/** Clears the card's image back to null — the learner-facing step falls back to a plain icon in that case (see OnboardingIntroCard), so removal needs no separate fallback logic. */
export async function removeOnboardingCardImage(): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("onboarding_intro_card")
    .select("image_url")
    .eq("id", 1)
    .maybeSingle();
  const path = current?.image_url ? onboardingCardPathFromUrl(current.image_url) : null;

  if (path) {
    const { error: removeError } = await supabase.storage.from("onboarding-card").remove([path]);
    if (removeError) {
      console.error("[admin] removeOnboardingCardImage: Storage remove failed", {
        path,
        message: removeError.message,
      });
    }
  }

  const { error: updateError } = await supabase
    .from("onboarding_intro_card")
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (updateError) return { error: "Couldn't remove the image. Please try again." };

  void logAdminAction("onboarding_intro_card.image_removed", "onboarding_intro_card", null);
  revalidatePath("/admin/onboarding-card");
  return { success: "Image removed." };
}
