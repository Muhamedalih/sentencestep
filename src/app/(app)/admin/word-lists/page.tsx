import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { WordGroupTable } from "@/components/admin/word-group-table";
import { Button } from "@/components/ui/button";
import { listWordGroupsAdmin } from "@/lib/admin/word-lists-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Word Lists",
};

export default async function AdminWordListsPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const groups = await listWordGroupsAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Word Lists</h1>
          <p className="text-muted-foreground mt-1">
            Level &gt; Group &gt; Word vocabulary practice. Open a group to manage its words.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/word-lists/new">Add group</Link>
        </Button>
      </div>

      <WordGroupTable groups={groups} />
    </div>
  );
}
