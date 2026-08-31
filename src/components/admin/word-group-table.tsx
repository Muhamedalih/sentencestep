"use client";

import Link from "next/link";

import { ArchiveWordGroupButton } from "@/components/admin/archive-word-group-button";
import { RestoreWordGroupButton } from "@/components/admin/restore-word-group-button";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { Badge } from "@/components/ui/badge";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { bulkUpdateWordGroupStatus } from "@/lib/admin/word-lists-actions";
import type { AdminWordGroup } from "@/lib/admin/word-lists-queries";
import { tierLabel, type Difficulty } from "@/lib/levels";
import { WORDS_PER_GROUP } from "@/types/word-lists";

const DIFFICULTY_BY_LEVEL: Record<number, Difficulty> = {
  1: "beginner",
  2: "intermediate",
  3: "advanced",
};

const STATUS_VARIANT = {
  draft: "muted",
  published: "success",
  archived: "outline",
} as const;

/** The Word Lists list's table — same client/server split as ContentTable, see that component's doc comment. */
export function WordGroupTable({ groups }: { groups: AdminWordGroup[] }) {
  const ids = groups.map((group) => group.id);
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
            run: (bulkIds) => bulkUpdateWordGroupStatus(bulkIds, "archived"),
          },
          {
            label: "Restore to draft",
            pendingLabel: "Restoring…",
            variant: "ghost",
            run: (bulkIds) => bulkUpdateWordGroupStatus(bulkIds, "draft"),
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
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Words</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center">
                  No word groups yet.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${group.title}`}
                      checked={isSelected(group.id)}
                      onChange={() => toggle(group.id)}
                      className="accent-primary size-4"
                    />
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{group.orderIndex}</td>
                  <td className="px-4 py-3 font-medium">{group.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {tierLabel(DIFFICULTY_BY_LEVEL[group.level] as Difficulty).label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        group.wordCount !== WORDS_PER_GROUP ? "text-accent-foreground" : undefined
                      }
                    >
                      {group.wordCount}
                    </span>
                    <span className="text-muted-foreground"> / {WORDS_PER_GROUP}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={group.isFree ? "outline" : "secondary"}>
                      {group.isFree ? "Free" : "Premium"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[group.status]}>{group.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {group.wordCount > 0 && (
                        <Link
                          href={`/admin/word-lists/${group.id}/preview`}
                          className="hover:bg-muted rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                        >
                          Preview
                        </Link>
                      )}
                      <Link
                        href={`/admin/word-lists/${group.id}/edit`}
                        className="hover:bg-muted rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      {group.status === "archived" ? (
                        <RestoreWordGroupButton id={group.id} />
                      ) : (
                        <ArchiveWordGroupButton id={group.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
