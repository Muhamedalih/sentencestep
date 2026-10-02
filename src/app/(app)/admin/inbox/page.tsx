import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { InboxReplyForm } from "@/components/admin/inbox-reply-form";
import { InboxStatusControl } from "@/components/admin/inbox-status-control";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import {
  listInboundEmails,
  type InboundEmailStatus,
  type InboxView,
} from "@/lib/admin/inbox-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Inbox",
};

const STATUS_VARIANT: Record<InboundEmailStatus, "secondary" | "outline" | "success" | "muted"> = {
  new: "secondary",
  read: "outline",
  replied: "success",
  archived: "muted",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const params = await searchParams;
  const view: InboxView = params.view === "archived" ? "archived" : "active";

  const messages = await listInboundEmails(view);
  const newCount = messages.filter((message) => message.status === "new").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          Inbox
          {newCount > 0 && <Badge variant="secondary">{newCount} new</Badge>}
        </h1>
        <p className="text-muted-foreground mt-1">
          Replies learners send to the emails you send them, newest first. Messages are shown as
          plain text.
        </p>
      </div>

      <div className="flex gap-2 text-sm font-medium">
        <Link
          href="/admin/inbox"
          className={`rounded-md px-3 py-1.5 ${view === "active" ? "bg-muted" : "text-muted-foreground hover:text-foreground"}`}
        >
          Inbox
        </Link>
        <Link
          href="/admin/inbox?view=archived"
          className={`rounded-md px-3 py-1.5 ${view === "archived" ? "bg-muted" : "text-muted-foreground hover:text-foreground"}`}
        >
          Archived
        </Link>
      </div>

      {messages.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-12 text-center text-sm">
          {view === "archived"
            ? "No archived messages."
            : "No messages yet — nothing has been replied to."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div key={message.id} className="border-border rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {message.fromName ? `${message.fromName} ` : ""}
                      <span className={message.fromName ? "text-muted-foreground font-normal" : ""}>
                        {message.fromName ? `<${message.fromEmail}>` : message.fromEmail}
                      </span>
                    </span>
                    <Badge variant={STATUS_VARIANT[message.status]}>{message.status}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatDate(message.receivedAt)}
                    {message.toEmail ? ` · to ${message.toEmail}` : ""}
                  </p>
                </div>
                <InboxStatusControl id={message.id} status={message.status} />
              </div>

              <p dir="auto" className="mt-3 text-sm font-medium">
                {message.subject || "(no subject)"}
              </p>
              <p dir="auto" className="mt-2 max-h-80 overflow-y-auto text-sm whitespace-pre-wrap">
                {message.bodyText || "(empty message)"}
              </p>
              {message.attachmentNames.length > 0 && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Attachments not shown: {message.attachmentNames.join(", ")}
                </p>
              )}

              <div className="mt-3">
                <InboxReplyForm
                  inboundEmailId={message.id}
                  fromEmail={message.fromEmail}
                  subject={message.subject}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
