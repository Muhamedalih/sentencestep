import { createClient } from "@/lib/supabase/server";

export type InboundEmailStatus = "new" | "read" | "replied" | "archived";
export type InboxView = "active" | "archived";

export interface AdminInboundEmail {
  id: string;
  fromEmail: string;
  fromName: string | null;
  toEmail: string;
  subject: string;
  bodyText: string;
  attachmentNames: string[];
  status: InboundEmailStatus;
  receivedAt: string;
}

/** The newest N messages shown at once — an inbox for a small support queue, not an archive browser. */
const INBOX_PAGE_LIMIT = 100;

/**
 * Admin reads for Inbox — the session-aware client, like Reports:
 * inbound_emails' RLS grants is_admin() sessions full access (see
 * 20250326000000_inbound_emails.sql), so no service-role client is needed.
 * "active" is everything not archived.
 */
export async function listInboundEmails(view: InboxView): Promise<AdminInboundEmail[]> {
  const supabase = await createClient();
  const query = supabase
    .from("inbound_emails")
    .select(
      "id, from_email, from_name, to_email, subject, body_text, attachment_names, status, received_at",
    )
    .order("received_at", { ascending: false })
    .limit(INBOX_PAGE_LIMIT);

  const { data, error } = await (view === "archived"
    ? query.eq("status", "archived")
    : query.neq("status", "archived"));
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    fromEmail: row.from_email,
    fromName: row.from_name,
    toEmail: row.to_email,
    subject: row.subject,
    bodyText: row.body_text,
    attachmentNames: row.attachment_names,
    status: row.status,
    receivedAt: row.received_at,
  }));
}

/** Powers the admin nav badge — messages nobody has opened yet. */
export async function countNewInboundEmails(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("inbound_emails")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  if (error) throw error;
  return count ?? 0;
}
