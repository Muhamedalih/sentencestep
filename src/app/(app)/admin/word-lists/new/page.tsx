import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { WordGroupForm } from "@/components/admin/word-group-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Add word group",
};

export default function NewWordGroupPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

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
          <WordGroupForm />
        </CardContent>
      </Card>
    </div>
  );
}
