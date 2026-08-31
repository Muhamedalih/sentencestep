import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { VoiceCollections } from "@/components/admin/voice-collections";
import { VoiceSettingsForm } from "@/components/admin/voice-settings-form";
import { ElevenLabsSettingsForm } from "@/components/admin/elevenlabs-settings-form";
import { ElevenLabsVoiceForm } from "@/components/admin/elevenlabs-voice-form";
import { Button } from "@/components/ui/button";
import { getVoiceSettings } from "@/lib/admin/voice-queries";
import { getDefaultVoiceId, getVoices } from "@/lib/admin/voices-queries";
import { getElevenLabsSettings, getElevenLabsVoices } from "@/lib/admin/elevenlabs-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Voice",
};

export default async function AdminVoicePage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const [settings, voices, defaultVoiceId, elevenlabsSettings, elevenlabsVoices] =
    await Promise.all([
      getVoiceSettings(),
      getVoices(),
      getDefaultVoiceId(),
      getElevenLabsSettings(),
      getElevenLabsVoices(),
    ]);

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
      <ElevenLabsVoiceForm voices={elevenlabsVoices} settings={elevenlabsSettings} />
      <ElevenLabsSettingsForm initial={elevenlabsSettings} voices={elevenlabsVoices} />
    </div>
  );
}
