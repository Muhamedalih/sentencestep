import type { Metadata } from "next";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AUDIT_LOG_PAGE_SIZE,
  listAuditLogEntityTypes,
  listAuditLogEntries,
} from "@/lib/admin/audit-log-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Audit log",
};

interface AuditLogSearchParams {
  entityType?: string;
  page?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** "lesson.bulk_archived" -> "Lesson · bulk archived" — readable without a lookup table, since new action strings get added every time a new admin mutation is instrumented. */
function formatAction(action: string): string {
  const [entity, ...rest] = action.split(".");
  const verb = rest.join(" ").replace(/_/g, " ");
  return `${entity} · ${verb}`;
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<AuditLogSearchParams>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const [{ entries, totalCount }, entityTypes] = await Promise.all([
    listAuditLogEntries({ entityType: params.entityType || undefined }, page),
    listAuditLogEntityTypes(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground mt-1">
          Every admin change, newest first — who did what, and when. Append-only: nothing here can
          be edited or deleted, even by an admin.
        </p>
      </div>

      <Card>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="entityType" className="text-xs font-medium">
                Area
              </label>
              <select
                id="entityType"
                name="entityType"
                defaultValue={params.entityType ?? ""}
                className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
              >
                <option value="">All</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="border-input bg-secondary text-secondary-foreground h-9 rounded-lg border px-4 text-sm font-medium"
            >
              Apply
            </button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs font-medium tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                  No admin activity recorded yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">{entry.adminEmail}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{formatAction(entry.action)}</Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {entry.entityType}
                    {entry.entityId && <code className="ms-1.5">{entry.entityId}</code>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        page={page}
        pageSize={AUDIT_LOG_PAGE_SIZE}
        totalCount={totalCount}
        basePath="/admin/audit-log"
        searchParams={{ entityType: params.entityType }}
      />
    </div>
  );
}
