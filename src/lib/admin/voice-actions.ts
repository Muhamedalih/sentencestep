"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import {
  VOICE_PITCH_RANGE,
  VOICE_RATE_RANGE,
  VOICE_VOLUME_RANGE,
} from "@/lib/admin/voice-settings";
import type { VoiceSettings } from "@/lib/admin/voice-settings";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "You don't have permission to do that.";
  return null;
}

function inRange(value: number, range: { min: number; max: number }): boolean {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}

/**
 * Persists the admin's chosen default voice + rate/pitch/volume as the one
 * row every learner's browser reads back through getVoiceSettings(). Only
 * ever called with a voiceName/voiceLang the admin actually picked from
 * their own browser's live voice list (see voice-settings-form.tsx) — this
 * function just validates and stores it, it never invents or normalizes a
 * voice name itself.
 */
export async function saveVoiceSettings(input: VoiceSettings): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  if (!inRange(input.rate, VOICE_RATE_RANGE)) {
    return { error: `Rate must be between ${VOICE_RATE_RANGE.min} and ${VOICE_RATE_RANGE.max}.` };
  }
  if (!inRange(input.pitch, VOICE_PITCH_RANGE)) {
    return {
      error: `Pitch must be between ${VOICE_PITCH_RANGE.min} and ${VOICE_PITCH_RANGE.max}.`,
    };
  }
  if (!inRange(input.volume, VOICE_VOLUME_RANGE)) {
    return {
      error: `Volume must be between ${VOICE_VOLUME_RANGE.min} and ${VOICE_VOLUME_RANGE.max}.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tts_settings")
    .update({
      voice_name: input.voiceName,
      voice_lang: input.voiceLang,
      rate: input.rate,
      pitch: input.pitch,
      volume: input.volume,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: "Couldn't save the voice settings. Please try again." };

  void logAdminAction("voice_settings.updated", "voice_settings", null, {
    voiceName: input.voiceName,
  });
  revalidatePath("/admin/voice");
  return { success: "Voice settings saved." };
}
