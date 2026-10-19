import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { DeletePassageButton } from "@/components/admin/delete-passage-button";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { PassageBackgroundField } from "@/components/admin/passage-background-field";
import { PassageNarrationPanel } from "@/components/admin/passage-narration-panel";
import {
  PassageAccessSelect,
  PassageStatusSelect,
} from "@/components/admin/passage-publish-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminPassage } from "@/lib/admin/passages-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Passage",
};

const WORD_LESSON_TEXT = {
  published: "Listed in Word Lists — a passage's word lesson is meant to stay hidden.",
  draft: "Hidden from learners — a passage's word lesson is never listed in Word Lists.",
  archived: "Archived in Word Lists.",
} as const;

export default async function AdminPassagePage({
  params,
}: {
  params: Promise<{ passageId: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { passageId } = await params;
  const passage = await getAdminPassage(passageId);
  if (!passage) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ms-3 mb-2">
          <Link href="/admin/passages">
            <ArrowLeft aria-hidden="true" />
            Passages
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{passage.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {passage.level} · position {passage.order} · {passage.sections} parts ·{" "}
              {passage.lines} lines
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/learn/passages/${passage.id}`} target="_blank">
              <ExternalLink aria-hidden="true" />
              Preview as a learner
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publishing</CardTitle>
          <CardDescription>
            A draft is seen by admins only, as a preview. A Premium passage opens for subscribers
            and admins; everyone else sees its lock screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-6">
            <label className="flex flex-col gap-1.5 text-sm">
              Status
              <PassageStatusSelect passageId={passage.id} status={passage.status} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Access
              <PassageAccessSelect passageId={passage.id} isFree={passage.isFree} />
            </label>
          </div>
          <p className="text-muted-foreground text-sm">
            Word lesson:{" "}
            {passage.wordGroupStatus
              ? WORD_LESSON_TEXT[passage.wordGroupStatus]
              : "this passage has none."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Background picture</CardTitle>
          <CardDescription>
            A picture of your choice for this passage. It becomes the passage&apos;s poster on the
            list, on Home and on the lock screen, and a soft backdrop at the top of the lesson
            itself. Without one the passage keeps its own colour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PassageBackgroundField
            passageId={passage.id}
            title={passage.title}
            order={passage.order}
            tone={passage.tone}
            posterUrl={passage.posterUrl}
          />
        </CardContent>
      </Card>

      <PassageNarrationPanel passage={passage} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delete this passage</CardTitle>
          <CardDescription>
            Removes it for good, with its narrated audio, its word lesson and every learner&apos;s
            progress on it. Only a draft can be deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passage.status === "published" ? (
            <p className="text-muted-foreground text-sm">
              Move it back to draft above to delete it.
            </p>
          ) : (
            <DeletePassageButton passageId={passage.id} title={passage.title} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
