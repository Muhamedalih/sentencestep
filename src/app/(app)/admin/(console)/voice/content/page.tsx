import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { VoiceBulkGenerateControl } from "@/components/admin/voice-bulk-generate-control";
import { VoiceDashboardRow } from "@/components/admin/voice-dashboard-row";
import { Card, CardContent } from "@/components/ui/card";
import { listVoiceGenerationDashboardRows } from "@/lib/admin/voice-generation-queries";
import { getVoices } from "@/lib/admin/voices-queries";
import { getCartesiaVoices } from "@/lib/admin/cartesia-queries";
import { STORIES_AND_BOOKS_PROVIDER } from "@/lib/voice/content-provider-map";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Story Audio Status" };

/** Unified Stories + Conversations + Normal lessons + Books narration dashboard — mirrors /admin/translations' dashboard shape: one row per published Stories lesson, published Conversation lesson, published Normal lesson, and published Book, its audio completeness, an inline Generate button, and a per-row voice picker. */
export default async function AdminVoiceContentPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const [rows, allVoices, cartesiaVoicesForNormal] = await Promise.all([
    listVoiceGenerationDashboardRows(),
    getVoices(),
    getCartesiaVoices(),
  ]);
  const storyRows = rows.filter((r) => r.contentType === "story");
  const conversationRows = rows.filter((r) => r.contentType === "conversation");
  const normalRows = rows.filter((r) => r.contentType === "normal");
  const bookRows = rows.filter((r) => r.contentType === "book");
  // Stories/Conversations/Books are permanently ElevenLabs (see
  // content-provider-map.ts) — resolveTargetVoices/loadBookForVoiceWork both
  // reject a mismatched-provider voice_id, silently falling back to the
  // default — so the picker only ever offers voices that would actually
  // work if chosen.
  const pickableVoices = allVoices.filter((voice) => voice.source === STORIES_AND_BOOKS_PROVIDER);
  // Normal lessons are permanently Cartesia (reassigned from Hume
  // 2026-09-10 — see content-provider-map.ts's NORMAL_LESSON_PROVIDER doc
  // comment) — loadLessonForVoiceWork always resolves and generates them
  // through Cartesia specifically, regardless of Stories/Books' own
  // provider (see that function's own doc comment) — so their row picker
  // must offer Cartesia voices, never ElevenLabs' or Hume's, or every
  // selection here would silently fail to resolve and fall back to the
  // default Normal-lesson voice instead.
  const normalPickableVoices = cartesiaVoicesForNormal;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Story audio status</h1>
        <p className="text-muted-foreground mt-1">
          Narration audio for every published Story, Conversation, Normal lesson, and Book. Stories,
          Conversations, and Books always use ElevenLabs; Normal lessons (Daily Lessons) always use
          Cartesia — each is a fixed assignment, never auto-detected (see &quot;Default voice —
          Normal Lessons&quot; and &quot;Default voice — Word Lists&quot; on the main Voice page).
          Each row&apos;s own voice picker sets that item&apos;s narration voice directly — for a
          Normal lesson this is also what a learner actually hears (see PronunciationButton), so
          picking a voice there and generating is a one-step way to narrate that specific lesson.
          Changing a default voice doesn&apos;t retroactively regenerate existing audio — use
          &quot;Generate Missing Audio&quot; below, or a row&apos;s own &quot;Generate&quot; button,
          after changing it.
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
              <VoiceDashboardRow key={`normal-${row.id}`} row={row} voices={normalPickableVoices} />
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
