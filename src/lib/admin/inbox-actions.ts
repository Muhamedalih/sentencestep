"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { InboundEmailStatus } from "@/lib/admin/inbox-queries";
import { createClient } from "@/lib/supabase/server";

export interface InboxActionState {
  error?: string;
}

const VALID_STATUSES: InboundEmailStatus[] = ["new", "read", "replied", "archived"];

export async function updateInboundEmailStatus(
  id: string,
  status: InboundEmailStatus,
): Promise<InboxActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inbound_emails")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Failed to update this message. Please try again." };

  void logAdminAction("inbox.status_changed", "inbound_email", id, { status });
  revalidatePath("/admin/inbox");
  return {};
}
