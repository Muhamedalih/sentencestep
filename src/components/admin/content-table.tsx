"use client";

import Link from "next/link";

import { ArchiveButton } from "@/components/admin/archive-button";
import { RestoreButton } from "@/components/admin/restore-button";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { bulkUpdateLessonStatus } from "@/lib/admin/content-actions";
import type { AdminLessonSummary } from "@/lib/admin/content-queries";
import { difficultyForLevel, tierLabel } from "@/lib/levels";
import { modeMeta } from "@/lib/learning-modes";
import type { ContentStatus } from "@/lib/admin/validation";

const STATUS_BADGE_VARIANT: Record<ContentStatus, "default" | "secondary" | "outline"> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
};

/**
 * The Content list's table, its own client component so a checkbox column +
 * bulk-select state can live alongside it — the page itself stays a Server
 * Component that only fetches/filters/paginates (see admin/content/page.tsx).
 */
export function ContentTable({ lessons }: { lessons: AdminLessonSummary[] }) {
  const ids = lessons.map((lesson) => lesson.id);
  const { selected, isSelected, allSelected, toggle, toggleAll, clear } = useBulkSelection(ids);

  return (
    <div className="flex flex-col gap-3">
      <BulkActionBar
        ids={selected}
        onClear={clear}
        actions={[
          {
            label: "Archive selected",
            pendingLabel: "Archiving…",
            run: (bulkIds) => bulkUpdateLessonStatus(bulkIds, "archived"),
          },
          {
            label: "Restore to draft",
            pendingLabel: "Restoring…",
            variant: "ghost",
            run: (bulkIds) => bulkUpdateLessonStatus(bulkIds, "draft"),
          },
        ]}
      />

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-primary size-4"
                />
              </th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {lessons.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-muted-foreground px-4 py-8 text-center">
                  No content matches these filters.
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => {
                const tier = tierLabel(difficultyForLevel(lesson.level));
                return (
                  <tr key={lesson.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${lesson.title}`}
                        checked={isSelected(lesson.id)}
                        onChange={() => toggle(lesson.id)}
                        className="accent-primary size-4"
                      />
                    </td>
                    <td className="max-w-[16rem] truncate px-4 py-3 font-medium">
                      <Link href={`/admin/content/${lesson.id}/edit`} className="hover:underline">
                        {lesson.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{modeMeta[lesson.mode].title}</td>
                    <td className="px-4 py-3">{lesson.level}</td>
                    <td className="px-4 py-3">{tier.label}</td>
                    <td className="px-4 py-3">
                      <Badge variant={lesson.isFree ? "success" : "muted"}>
                        {lesson.isFree ? "Free" : "Premium"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE_VARIANT[lesson.status]}>{lesson.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{lesson.orderIndex}</td>
                    <td className="text-muted-foreground px-4 py-3">
                      {new Date(lesson.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/content/${lesson.id}/preview`}>Preview</Link>
                        </Button>
                        {lesson.status === "archived" ? (
                          <RestoreButton id={lesson.id} />
                        ) : (
                          <ArchiveButton id={lesson.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
