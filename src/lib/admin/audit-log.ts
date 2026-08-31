import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * Records one "who changed what" entry (see 20250214000000_admin_audit_log.sql).
 * Called from inside an admin action AFTER its own requireAdmin() check and
 * AFTER the underlying mutation already succeeded — logging is a side
 * effect of a real change, never a gate on it. Deliberately swallows its
 * own errors: a failed audit-log write must never turn an otherwise-
 * successful admin action into a reported failure, the same rationale
 * evaluateAndNotify uses for milestone emails.
 */
export async function logAdminAction(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    const supabase = await createClient();
    const { error } = await supabase.from("admin_audit_log").insert({
      admin_id: user.id,
      admin_email: user.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
    if (error) console.error("[audit-log] insert failed", error);
  } catch (error) {
    console.error("[audit-log] logAdminAction failed", error);
  }
}
