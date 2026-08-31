import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { VoiceBulkGenerateControl } from "@/components/admin/voice-bulk-generate-control";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listVoiceGenerationDashboardRows } from "@/lib/admin/voice-generation-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Story Audio Status" };

/** Mirrors /admin/translations' dashboard shape: one row per Stories/Conversation lesson with its audio completeness, linking to a per-lesson detail page. */
export default async function AdminVoiceContentPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const rows = await listVoiceGenerationDashboardRows();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Story audio status</h1>
        <p className="text-muted-foreground mt-1">
          ElevenLabs-generated narration/dialogue audio for every published Story and Conversation
          lesson.
        </p>
      </div>
      <VoiceBulkGenerateControl />
      <Card>
        <CardContent className="flex flex-col divide-y p-0">
          {rows.length === 0 && (
            <p className="text-muted-foreground p-6 text-center text-sm">
              No published Stories/Conversation lessons yet.
            </p>
          )}
          {rows.map((row) => {
            const complete = row.totalSentences > 0 && row.readyCount === row.totalSentences;
            return (
              <Link
                key={row.lessonId}
                href={`/admin/voice/content/${row.lessonId}`}
                className="hover:bg-muted flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium">{row.title}</span>
                  <span className="text-muted-foreground ml-2 text-xs capitalize">{row.mode}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={complete ? "success" : "outline"}>
                    {row.readyCount}/{row.totalSentences} ready
                  </Badge>
                  {row.failedCount > 0 && (
                    <Badge variant="outline" className="text-danger border-danger/40">
                      {row.failedCount} failed
                    </Badge>
                  )}
                  {row.unresolvedCount > 0 && (
                    <Badge variant="outline">{row.unresolvedCount} unresolved</Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
