import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { VoiceCollections } from "@/components/admin/voice-collections";
import { PronunciationDefaultVoiceForm } from "@/components/admin/pronunciation-default-voice-form";
import { NormalLessonDefaultVoiceForm } from "@/components/admin/normal-lesson-default-voice-form";
import { VoiceSettingsForm } from "@/components/admin/voice-settings-form";
import { ElevenLabsSettingsForm } from "@/components/admin/elevenlabs-settings-form";
import { ElevenLabsVoiceForm } from "@/components/admin/elevenlabs-voice-form";
import { EdgeTtsVoiceForm } from "@/components/admin/edge-tts-voice-form";
import { CartesiaVoiceForm } from "@/components/admin/cartesia-voice-form";
import { HumeVoiceForm } from "@/components/admin/hume-voice-form";
import { Button } from "@/components/ui/button";
import { getVoiceSettings } from "@/lib/admin/voice-queries";
import {
  getDefaultNormalLessonVoiceId,
  getDefaultPronunciationVoiceId,
  getDefaultVoiceId,
  getVoices,
} from "@/lib/admin/voices-queries";
import { getElevenLabsSettings, getElevenLabsVoices } from "@/lib/admin/elevenlabs-queries";
import { getEdgeTtsVoices } from "@/lib/admin/edge-tts-queries";
import { getCartesiaVoices } from "@/lib/admin/cartesia-queries";
import { getHumeVoices } from "@/lib/admin/hume-queries";
import { DEFAULT_CARTESIA_MODEL } from "@/lib/voice/content-provider-map";
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
    defaultPronunciationVoiceId,
    defaultNormalLessonVoiceId,
    elevenlabsSettings,
    elevenlabsVoices,
    edgeTtsVoices,
    cartesiaVoices,
    humeVoices,
  ] = await Promise.all([
    getVoiceSettings(),
    getVoices(),
    getDefaultVoiceId(),
    getDefaultPronunciationVoiceId(),
    getDefaultNormalLessonVoiceId(),
    getElevenLabsSettings(),
    getElevenLabsVoices(),
    getEdgeTtsVoices(),
    getCartesiaVoices(),
    getHumeVoices(),
  ]);

  // The "default narration voice" dropdown (ElevenLabsSettingsForm) needs
  // every candidate voice regardless of which provider is currently active
  // — an admin switching between ELEVENLABS_API_KEY, CARTESIA_API_KEY,
  // HUME_API_KEY, and the zero-config Edge-TTS fallback should still see
  // every provider's registered voices to choose from, not just whichever
  // one happens to be active right now.
  const narrationVoices = [...edgeTtsVoices, ...elevenlabsVoices, ...cartesiaVoices, ...humeVoices];

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
      <NormalLessonDefaultVoiceForm
        voices={humeVoices}
        currentVoiceId={defaultNormalLessonVoiceId}
      />
      <PronunciationDefaultVoiceForm
        voices={cartesiaVoices}
        currentVoiceId={defaultPronunciationVoiceId}
      />
      <VoiceSettingsForm initial={settings} />
      <EdgeTtsVoiceForm voices={edgeTtsVoices} />
      <ElevenLabsSettingsForm initial={elevenlabsSettings} voices={narrationVoices} />
      <ElevenLabsVoiceForm voices={elevenlabsVoices} settings={elevenlabsSettings} />
      <CartesiaVoiceForm voices={cartesiaVoices} model={DEFAULT_CARTESIA_MODEL} />
      <HumeVoiceForm voices={humeVoices} />
    </div>
  );
}
