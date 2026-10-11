import type { VoiceRow } from "@/lib/admin/voices-queries";
import { getVoices } from "@/lib/admin/voices-queries";

/** Every registered Fish Audio voice — a thin filter over the same getVoices() every other provider's admin UI reads, kept as one query rather than another `voices` fetch path. Mirrors getCartesiaVoices(). */
export async function getFishAudioVoices(): Promise<VoiceRow[]> {
  const voices = await getVoices();
  return voices.filter((voice) => voice.source === "fish-audio");
}
