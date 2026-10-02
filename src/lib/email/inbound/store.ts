import type { InboundEmailRow } from "@/lib/email/inbound/parse";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const POSTGRES_UNIQUE_VIOLATION = "23505";

/** Cheap pre-check so a redelivered webhook skips the provider fetch entirely. */
export async function inboundEmailExists(providerEmailId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("inbound_emails")
    .select("id")
    .eq("provider_email_id", providerEmailId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/**
 * Inserts a received message. A unique violation on provider_email_id means
 * two deliveries raced past the pre-check — the first one won, so this is a
 * duplicate, not an error.
 */
export async function storeInboundEmail(row: InboundEmailRow): Promise<"stored" | "duplicate"> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("inbound_emails").insert(row);
  if (!error) return "stored";
  if (error.code === POSTGRES_UNIQUE_VIOLATION) return "duplicate";
  throw error;
}
