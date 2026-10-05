import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { WordGroupForm } from "@/components/admin/word-group-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVoices } from "@/lib/admin/voices-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { WORD_LIST_PROVIDER } from "@/lib/voice/content-provider-map";

export const metadata: Metadata = {
  title: "Add word group",
};

export default async function NewWordGroupPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  // Word Lists is permanently pinned to Edge-TTS (see
  // content-provider-map.ts) — same "only offer voices that would
  // actually work if chosen" filtering AdminVoiceContentPage already
  // applies for Stories/Books and Normal lessons.
  const voices = (await getVoices()).filter((voice) => voice.source === WORD_LIST_PROVIDER);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Add word group</h1>
        <p className="text-muted-foreground mt-1">
          Create the group first, then add its words on the next screen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <WordGroupForm voices={voices} />
        </CardContent>
      </Card>
    </div>
  );
}
