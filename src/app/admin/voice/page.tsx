import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { VoiceCollections } from "@/components/admin/voice-collections";
import { VoiceSettingsForm } from "@/components/admin/voice-settings-form";
import { ElevenLabsSettingsForm } from "@/components/admin/elevenlabs-settings-form";
import { ElevenLabsVoiceForm } from "@/components/admin/elevenlabs-voice-form";
import { AzureVoiceForm } from "@/components/admin/azure-voice-form";
import { EdgeTtsVoiceForm } from "@/components/admin/edge-tts-voice-form";
import { GeminiVoiceForm } from "@/components/admin/gemini-voice-form";
import { Button } from "@/components/ui/button";
import { getVoiceSettings } from "@/lib/admin/voice-queries";
import { getDefaultVoiceId, getVoices } from "@/lib/admin/voices-queries";
import { getElevenLabsSettings, getElevenLabsVoices } from "@/lib/admin/elevenlabs-queries";
import { getAzureVoices } from "@/lib/admin/azure-queries";
import { getEdgeTtsVoices } from "@/lib/admin/edge-tts-queries";
import { getGeminiVoices } from "@/lib/admin/gemini-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Voice",
};

export default async function AdminVoicePage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const [
    settings,
    voices,
    defaultVoiceId,
    elevenlabsSettings,
    elevenlabsVoices,
    azureVoices,
    edgeTtsVoices,
    geminiVoices,
  ] = await Promise.all([
    getVoiceSettings(),
    getVoices(),
    getDefaultVoiceId(),
    getElevenLabsSettings(),
    getElevenLabsVoices(),
    getAzureVoices(),
    getEdgeTtsVoices(),
    getGeminiVoices(),
  ]);

  // The "default narration voice" dropdown (ElevenLabsSettingsForm) needs
  // every candidate voice regardless of which provider is currently active
  // — an admin switching between AZURE_SPEECH_KEY, GEMINI_API_KEY,
  // ELEVENLABS_API_KEY, and the zero-config Edge-TTS fallback should still
  // see every provider's registered voices to choose from, not just
  // whichever one happens to be active right now.
  const narrationVoices = [...geminiVoices, ...edgeTtsVoices, ...azureVoices, ...elevenlabsVoices];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Voice</h1>
          <p className="text-muted-foreground mt-1">
            The default voice every learner&apos;s browser tries to match for automatic
            pronunciation and replay.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/admin/voice/content">Story audio status</Link>
        </Button>
      </div>
      <VoiceCollections voices={voices} defaultVoiceId={defaultVoiceId} />
      <VoiceSettingsForm initial={settings} />
      <GeminiVoiceForm voices={geminiVoices} />
      <EdgeTtsVoiceForm voices={edgeTtsVoices} />
      {/*
        Narration settings (the "Default narration voice (Stories & Books)"
        picker) sits right after Gemini/Edge-TTS rather than at the very
        bottom, below Azure/ElevenLabs — those two are the providers every
        deployment can actually use immediately (see provider-registry.ts),
        so picking a default is almost always the very next step after
        adding voices there, not something an admin should have to scroll
        past two other (often empty/paid) provider sections to find.
      */}
      <ElevenLabsSettingsForm initial={elevenlabsSettings} voices={narrationVoices} />
      <AzureVoiceForm voices={azureVoices} settings={elevenlabsSettings} />
      <ElevenLabsVoiceForm voices={elevenlabsVoices} settings={elevenlabsSettings} />
    </div>
  );
}
