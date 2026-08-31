import { createClient } from "@/lib/supabase/server";

export interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogFilters {
  entityType?: string;
}

export const AUDIT_LOG_PAGE_SIZE = 50;

export interface AuditLogPage {
  entries: AuditLogEntry[];
  totalCount: number;
}

/** Real server-side pagination, same convention as listContentLessons/listBooksAdmin — an audit trail is exactly the kind of table that grows without bound, so a silent client-side cap here would be the same mistake the translation dashboard's 200-row cap already was flagged for. */
export async function listAuditLogEntries(
  filters: AuditLogFilters,
  page = 1,
): Promise<AuditLogPage> {
  const supabase = await createClient();

  let query = supabase
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);

  const from = (page - 1) * AUDIT_LOG_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + AUDIT_LOG_PAGE_SIZE - 1);
  if (error) throw error;

  return {
    entries: (data ?? []).map((row) => ({
      id: row.id,
      adminEmail: row.admin_email,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.created_at,
    })),
    totalCount: count ?? 0,
  };
}

/** Distinct entity types seen so far, for the filter dropdown — small, bounded set (a couple dozen at most), safe to fetch in full rather than paginating. */
export async function listAuditLogEntityTypes(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("admin_audit_log").select("entity_type");
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((row) => row.entity_type))).sort();
}
