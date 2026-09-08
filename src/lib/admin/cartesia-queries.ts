import type { VoiceRow } from "@/lib/admin/voices-queries";
import { getVoices } from "@/lib/admin/voices-queries";

/** Every registered Cartesia voice — a thin filter over the same getVoices() every Kokoro/Azure/Gemini/ElevenLabs/Edge-TTS admin UI already reads, kept as one query rather than a sixth `voices` fetch path. Mirrors getGeminiVoices()/getElevenLabsVoices(). */
export async function getCartesiaVoices(): Promise<VoiceRow[]> {
  const voices = await getVoices();
  return voices.filter((voice) => voice.source === "cartesia");
}
