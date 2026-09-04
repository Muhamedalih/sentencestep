import type { VoiceRow } from "@/lib/admin/voices-queries";
import { getVoices } from "@/lib/admin/voices-queries";

/** Every registered Azure voice — a thin filter over the same getVoices() every Kokoro/ElevenLabs admin UI already reads, kept as one query rather than a third `voices` fetch path. Mirrors getElevenLabsVoices() in elevenlabs-queries.ts. */
export async function getAzureVoices(): Promise<VoiceRow[]> {
  const voices = await getVoices();
  return voices.filter((voice) => voice.source === "azure");
}
