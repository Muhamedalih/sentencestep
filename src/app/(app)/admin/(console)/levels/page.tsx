import type { Metadata } from "next";
import Link from "next/link";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { DeleteLevelButton } from "@/components/admin/delete-level-button";
import { LevelForm } from "@/components/admin/level-form";
import { LevelPreviewForm } from "@/components/admin/level-preview-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listLevels } from "@/lib/admin/content-queries";
import { modeMeta } from "@/lib/learning-modes";
import { difficultyForLevel, splitLevelTitle, tierLabel } from "@/lib/levels";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Levels",
};

export default async function AdminLevelsPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const levels = await listLevels();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Levels</h1>
        <p className="text-muted-foreground mt-1">
          Difficulty is derived automatically from the level number, not set directly — see{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">src/lib/levels.ts</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a level</CardTitle>
          <CardDescription>Lessons reference one of these when created.</CardDescription>
        </CardHeader>
        <CardContent>
          <LevelForm />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {levels.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  No levels yet.
                </td>
              </tr>
            ) : (
              levels.map((level) => {
                const tier = tierLabel(difficultyForLevel(level.index));
                const titleAr = splitLevelTitle(level.titleAr);
                return (
                  <tr key={level.id}>
                    <td className="px-4 py-3">{modeMeta[level.mode].title}</td>
                    <td className="px-4 py-3">{level.index}</td>
                    <td className="px-4 py-3">
                      <span dir="ltr">{level.title}</span>{" "}
                      <span className="text-muted-foreground" dir="rtl">
                        {titleAr.label}
                        {titleAr.code && (
                          <>
                            {" — "}
                            <span dir="ltr">{titleAr.code}</span>
                          </>
                        )}
                      </span>{" "}
                      {level.titleEs && (
                        <span className="text-muted-foreground" dir="ltr">
                          / {level.titleEs}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{tier.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/levels/${level.id}/edit`}
                          className="hover:bg-muted rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteLevelButton id={level.id} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Start Simple previews</CardTitle>
          <CardDescription>
            The example sentences shown on the /learn homepage for each ordinary-lesson level,
            before any lesson — not lesson content.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {levels
            .filter((level) => level.mode === "normal")
            .map((level) => (
              <div
                key={level.id}
                className="border-border border-t pt-5 first:border-t-0 first:pt-0"
              >
                <p className="mb-3 text-sm font-medium">
                  Level {level.index} — <span dir="ltr">{level.title}</span>
                </p>
                <LevelPreviewForm levelId={level.id} initial={level.previewSentences} />
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
