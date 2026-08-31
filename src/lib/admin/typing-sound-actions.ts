"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import {
  TYPING_SOUND_VOLUME_RANGE,
  sanitizeSectionSentenceCompleteSounds,
} from "@/lib/admin/typing-sound-settings";
import type { TypingSoundSettings } from "@/lib/admin/typing-sound-settings";
import { SOUND_PACK_NAMES } from "@/lib/typing-sound-packs";
import { SENTENCE_COMPLETE_SOUND_NAMES } from "@/lib/sentence-complete-sounds";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "You don't have permission to do that.";
  return null;
}

function inRange(value: number, range: { min: number; max: number }): boolean {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}

/**
 * Persists the admin's chosen typing sound pack/volume/enabled toggle as the
 * one row every learner's TypingSoundSettingsProvider reads back through
 * getTypingSoundSettings().
 */
export async function saveTypingSoundSettings(input: TypingSoundSettings): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  if (!SOUND_PACK_NAMES.includes(input.soundPack)) {
    return { error: "Not a recognized sound pack." };
  }
  if (!SENTENCE_COMPLETE_SOUND_NAMES.includes(input.sentenceCompleteSound)) {
    return { error: "Not a recognized sentence completion sound." };
  }
  if (!inRange(input.volume, TYPING_SOUND_VOLUME_RANGE)) {
    return {
      error: `Volume must be between ${TYPING_SOUND_VOLUME_RANGE.min} and ${TYPING_SOUND_VOLUME_RANGE.max}.`,
    };
  }

  const cleanSectionSounds = sanitizeSectionSentenceCompleteSounds(
    input.sectionSentenceCompleteSounds,
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("typing_sound_settings")
    .update({
      enabled: input.enabled,
      sound_pack: input.soundPack,
      volume: input.volume,
      sentence_complete_sound: input.sentenceCompleteSound,
      section_sentence_complete_sounds: cleanSectionSounds as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: "Couldn't save the typing sound settings. Please try again." };

  void logAdminAction("typing_sound_settings.updated", "typing_sound_settings", null);
  revalidatePath("/admin/typing-sound");
  revalidatePath("/learn");
  return { success: "Typing sound settings saved." };
}
