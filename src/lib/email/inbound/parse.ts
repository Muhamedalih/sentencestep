/** Largest body kept per message — long threads are quoted-reply noise, and the table is read on every Inbox load. */
export const MAX_BODY_LENGTH = 20_000;
export const MAX_SUBJECT_LENGTH = 300;
const MAX_ATTACHMENT_NAMES = 20;

export interface ParsedAddress {
  email: string;
  name: string | null;
}

/** "Sara <sara@example.com>" or a bare "sara@example.com" — the two shapes providers send in `from`. */
export function parseAddress(value: string): ParsedAddress | null {
  const trimmed = value.trim();
  const angle = trimmed.match(/^(.*)<([^<>]+)>\s*$/);
  const email = (angle?.[2] ?? trimmed).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  const name = (angle?.[1] ?? "").trim().replace(/^"|"$/g, "").trim();
  return { email, name: name || null };
}

export interface InboundWebhookEvent {
  emailId: string;
  from: string;
  to: string[];
  subject: string;
}

/**
 * Reads the provider's `email.received` webhook (metadata only — the body is
 * fetched separately). Returns null for any other event type or a payload
 * missing what we need, so the route can acknowledge-and-ignore rather than
 * make the provider retry something that will never be useful.
 */
export function parseInboundWebhook(rawBody: string): InboundWebhookEvent | null {
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;

  const { type, data } = payload as { type?: unknown; data?: unknown };
  if (type !== "email.received" || !data || typeof data !== "object") return null;

  const { email_id, from, to, subject } = data as Record<string, unknown>;
  if (typeof email_id !== "string" || !email_id) return null;
  if (typeof from !== "string" || !from) return null;

  const recipients = Array.isArray(to)
    ? to.filter((entry): entry is string => typeof entry === "string")
    : typeof to === "string"
      ? [to]
      : [];

  return {
    emailId: email_id,
    from,
    to: recipients,
    subject: typeof subject === "string" ? subject : "",
  };
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * Last-resort plain text for a message that has only an HTML part. This is
 * for DISPLAY as escaped text — it is not a sanitizer and its output must
 * never be inserted as HTML. Scripts/styles are dropped with their content,
 * block-level tags become line breaks, remaining tags are removed.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Header shapes seen from providers: a name→value object, or a list of {name, value}. */
export type ReceivedEmailHeaders =
  Record<string, string | string[]> | { name: string; value: string }[] | null | undefined;

export interface ReceivedEmailContent {
  headers?: ReceivedEmailHeaders;
  text?: string | null;
  html?: string | null;
  subject?: string | null;
  message_id?: string | null;
  created_at?: string | null;
  attachments?: { filename?: string | null }[] | null;
}

export interface InboundEmailRow {
  provider_email_id: string;
  message_id: string | null;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string;
  body_text: string;
  attachment_names: string[];
  received_at: string;
}

/**
 * Combines the webhook metadata with the fetched body into the row to store.
 * Returns null when the sender isn't a usable address (nothing to reply to).
 * The plain-text part wins; HTML is only a fallback and is flattened to text.
 */
export function buildInboundEmailRow(
  event: InboundWebhookEvent,
  content: ReceivedEmailContent,
  fallbackReceivedAt: string,
): InboundEmailRow | null {
  const sender = parseAddress(event.from);
  if (!sender) return null;

  const recipient = event.to[0] ? (parseAddress(event.to[0])?.email ?? event.to[0]) : "";
  const body = content.text?.trim() ? content.text : content.html ? htmlToText(content.html) : "";
  const subject = (content.subject ?? event.subject).replace(/[\r\n]+/g, " ").trim();

  const received = content.created_at ? new Date(content.created_at) : null;

  return {
    provider_email_id: event.emailId,
    message_id: content.message_id?.trim() || null,
    from_email: sender.email,
    from_name: sender.name,
    to_email: recipient,
    subject: subject.slice(0, MAX_SUBJECT_LENGTH),
    body_text: body.trim().slice(0, MAX_BODY_LENGTH),
    attachment_names: (content.attachments ?? [])
      .map((attachment) => attachment.filename?.trim())
      .filter((name): name is string => Boolean(name))
      .slice(0, MAX_ATTACHMENT_NAMES),
    received_at:
      received && !Number.isNaN(received.getTime()) ? received.toISOString() : fallbackReceivedAt,
  };
}

function normalizeHeaders(headers: ReceivedEmailHeaders): Map<string, string> {
  const map = new Map<string, string>();
  if (!headers) return map;
  const entries: [string, unknown][] = Array.isArray(headers)
    ? headers.map((header): [string, unknown] => [header.name, header.value])
    : Object.entries(headers);
  for (const [name, value] of entries) {
    const text = Array.isArray(value) ? value.join(",") : value;
    if (typeof name === "string" && typeof text === "string") map.set(name.toLowerCase(), text);
  }
  return map;
}

/**
 * True for mail a machine sent — out-of-office replies, bounces, mailing-list
 * traffic (RFC 3834 `Auto-Submitted`, `Precedence`, or a mailer-daemon /
 * postmaster sender). These are still stored (a bounce is a useful signal that
 * an address is dead) but must never trigger an admin alert: an
 * auto-responder answering an alert is exactly how mail loops start.
 */
export function isAutomatedMessage(from: string, headers: ReceivedEmailHeaders): boolean {
  const map = normalizeHeaders(headers);

  const autoSubmitted = map.get("auto-submitted")?.trim().toLowerCase();
  if (autoSubmitted && autoSubmitted !== "no") return true;

  const precedence = map.get("precedence")?.trim().toLowerCase();
  if (precedence && ["bulk", "junk", "list", "auto_reply"].includes(precedence)) return true;

  const localPart = parseAddress(from)?.email.split("@")[0] ?? "";
  return localPart === "mailer-daemon" || localPart === "postmaster";
}
