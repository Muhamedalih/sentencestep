import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { PassageImport } from "@/components/admin/passage-import";
import { PassageVoiceCast } from "@/components/admin/passage-voice-cast";
import { PassagesTable } from "@/components/admin/passages-table";
import { getVoiceCast, listAdminPassages } from "@/lib/admin/passages-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Passages",
};

export default async function AdminPassagesPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const [passages, voiceCast] = await Promise.all([listAdminPassages(), getVoiceCast()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Passages</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Publish a passage or hold it back, make it Free or Premium, choose who speaks it and
          narrate it. The section itself — Off, Admin preview or On — is switched in{" "}
          <Link href="/admin/features" className="text-primary underline">
            Features
          </Link>
          ; learners see a passage only when the section is On and the passage is Published.
        </p>
      </div>

      <PassageVoiceCast cast={voiceCast} />
      <PassagesTable passages={passages} />
      <PassageImport />
    </div>
  );
}
