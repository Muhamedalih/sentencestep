import type { VoiceRow } from "@/lib/admin/voices-queries";
import { getVoices } from "@/lib/admin/voices-queries";

/** Every registered Gemini voice — a thin filter over the same getVoices() every Kokoro/Azure/ElevenLabs/Edge-TTS admin UI already reads, kept as one query rather than a fifth `voices` fetch path. Mirrors getEdgeTtsVoices()/getAzureVoices(). */
export async function getGeminiVoices(): Promise<VoiceRow[]> {
  const voices = await getVoices();
  return voices.filter((voice) => voice.source === "gemini");
}
