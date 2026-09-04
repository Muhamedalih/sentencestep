import type { VoiceRow } from "@/lib/admin/voices-queries";
import { getVoices } from "@/lib/admin/voices-queries";

/** Every registered Edge-TTS voice — a thin filter over the same getVoices() every Kokoro/Azure/ElevenLabs admin UI already reads, kept as one query rather than a fourth `voices` fetch path. Mirrors getAzureVoices()/getElevenLabsVoices(). */
export async function getEdgeTtsVoices(): Promise<VoiceRow[]> {
  const voices = await getVoices();
  return voices.filter((voice) => voice.source === "edge-tts");
}
