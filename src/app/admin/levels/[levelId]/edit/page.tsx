import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { LevelForm } from "@/components/admin/level-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listLevels } from "@/lib/admin/content-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Edit level",
};

export default async function EditLevelPage({ params }: { params: Promise<{ levelId: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { levelId } = await params;
  const levels = await listLevels();
  const level = levels.find((l) => l.id === levelId);
  if (!level) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Edit level</h1>
        <p className="text-muted-foreground mt-1">
          <span dir="ltr">{level.title}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <LevelForm initial={level} />
        </CardContent>
      </Card>
    </div>
  );
}
