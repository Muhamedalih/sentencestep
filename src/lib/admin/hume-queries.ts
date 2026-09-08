import type { VoiceRow } from "@/lib/admin/voices-queries";
import { getVoices } from "@/lib/admin/voices-queries";

/** Every registered Hume AI voice — a thin filter over the same getVoices() every Kokoro/Azure/Gemini/ElevenLabs/Edge-TTS/Cartesia admin UI already reads. Mirrors getCartesiaVoices()/getElevenLabsVoices(). */
export async function getHumeVoices(): Promise<VoiceRow[]> {
  const voices = await getVoices();
  return voices.filter((voice) => voice.source === "hume");
}
