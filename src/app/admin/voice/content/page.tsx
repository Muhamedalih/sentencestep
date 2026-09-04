import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { VoiceBulkGenerateControl } from "@/components/admin/voice-bulk-generate-control";
import { VoiceDashboardRow } from "@/components/admin/voice-dashboard-row";
import { Card, CardContent } from "@/components/ui/card";
import { listVoiceGenerationDashboardRows } from "@/lib/admin/voice-generation-queries";
import { getVoices } from "@/lib/admin/voices-queries";
import { getTTSProvider } from "@/lib/voice/provider-registry";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Story Audio Status" };

/** Unified Stories + Conversations + Normal lessons + Books narration dashboard — mirrors /admin/translations' dashboard shape: one row per published Stories lesson, published Conversation lesson, published Normal lesson, and published Book, its audio completeness, an inline Generate button, a per-row voice picker, and an "Exclude" toggle to opt an item out of the bulk sweep below and the cron sweep without unpublishing it. */
export default async function AdminVoiceContentPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const [rows, allVoices] = await Promise.all([listVoiceGenerationDashboardRows(), getVoices()]);
  const storyRows = rows.filter((r) => r.contentType === "story");
  const conversationRows = rows.filter((r) => r.contentType === "conversation");
  const normalRows = rows.filter((r) => r.contentType === "normal");
  const bookRows = rows.filter((r) => r.contentType === "book");
  // Only the active provider's own voices are ever a valid per-row override
  // (resolveTargetVoices/loadBookForVoiceWork both reject a mismatched-
  // provider voice_id, silently falling back to the global default) — so
  // the picker only ever offers voices that would actually work if chosen.
  const activeProviderName = getTTSProvider().name;
  const pickableVoices = allVoices.filter((voice) => voice.source === activeProviderName);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Story audio status</h1>
        <p className="text-muted-foreground mt-1">
          Narration audio (via the active provider — Azure, Gemini, ElevenLabs, or the built-in
          Edge-TTS fallback) for every published Story, Conversation, Normal lesson, and Book. Each
          row&apos;s own voice picker sets that item&apos;s narration voice directly — for a Normal
          lesson this is also what a learner actually hears (see PronunciationButton), so picking a
          voice there and generating replaces its free Kokoro pronunciation with narrated audio in
          one step. Changing the default narration voice above doesn&apos;t retroactively regenerate
          existing audio — use &quot;Generate Missing Audio&quot; below, or a row&apos;s own
          &quot;Generate&quot; button, after changing it.
        </p>
      </div>
      <VoiceBulkGenerateControl />

      <div>
        <h2 className="mb-2 text-lg font-semibold">Stories ({storyRows.length})</h2>
        <Card>
          <CardContent className="flex flex-col divide-y p-0">
            {storyRows.length === 0 && (
              <p className="text-muted-foreground p-6 text-center text-sm">
                No published Stories yet.
              </p>
            )}
            {storyRows.map((row) => (
              <VoiceDashboardRow key={`story-${row.id}`} row={row} voices={pickableVoices} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Conversations ({conversationRows.length})</h2>
        <Card>
          <CardContent className="flex flex-col divide-y p-0">
            {conversationRows.length === 0 && (
              <p className="text-muted-foreground p-6 text-center text-sm">
                No published Conversations yet.
              </p>
            )}
            {conversationRows.map((row) => (
              <VoiceDashboardRow key={`conversation-${row.id}`} row={row} voices={pickableVoices} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Normal Lessons ({normalRows.length})</h2>
        <Card>
          <CardContent className="flex flex-col divide-y p-0">
            {normalRows.length === 0 && (
              <p className="text-muted-foreground p-6 text-center text-sm">
                No published Normal lessons yet.
              </p>
            )}
            {normalRows.map((row) => (
              <VoiceDashboardRow key={`normal-${row.id}`} row={row} voices={pickableVoices} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Books ({bookRows.length})</h2>
        <Card>
          <CardContent className="flex flex-col divide-y p-0">
            {bookRows.length === 0 && (
              <p className="text-muted-foreground p-6 text-center text-sm">
                No published Books yet.
              </p>
            )}
            {bookRows.map((row) => (
              <VoiceDashboardRow key={`book-${row.id}`} row={row} voices={pickableVoices} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
