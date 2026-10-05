import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { WordGroupForm } from "@/components/admin/word-group-form";
import { WordGroupWordsForm } from "@/components/admin/word-group-words-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getVoices } from "@/lib/admin/voices-queries";
import { getWordGroupByIdAdmin } from "@/lib/admin/word-lists-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { WORD_LIST_PROVIDER } from "@/lib/voice/content-provider-map";

export const metadata: Metadata = {
  title: "Edit word group",
};

export default async function EditWordGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { groupId } = await params;
  const [group, allVoices] = await Promise.all([getWordGroupByIdAdmin(groupId), getVoices()]);
  if (!group) notFound();
  // Word Lists is permanently pinned to Edge-TTS (see
  // content-provider-map.ts) — same "only offer voices that would
  // actually work if chosen" filtering AdminVoiceContentPage already
  // applies for Stories/Books and Normal lessons.
  const voices = allVoices.filter((voice) => voice.source === WORD_LIST_PROVIDER);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit word group</h1>
          <p className="text-muted-foreground mt-1">{group.title}</p>
        </div>
        {group.words.length > 0 && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/word-lists/${group.id}/preview`}>Preview</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <WordGroupForm initial={group} voices={voices} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Words</CardTitle>
          <CardDescription>Order here is exactly the order learners see.</CardDescription>
        </CardHeader>
        <CardContent>
          <WordGroupWordsForm
            groupId={group.id}
            initial={group.words}
            alternatesSupported={group.alternatesSupported}
          />
        </CardContent>
      </Card>
    </div>
  );
}
