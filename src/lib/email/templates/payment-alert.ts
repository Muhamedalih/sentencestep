import { PAYMENT_REPORT_CATEGORY_LABELS } from "@/lib/billing/payment-report";
import type { PaymentReportCategory } from "@/lib/billing/payment-report";
import { escapeHtml, renderEmailLayout } from "@/lib/email/templates/layout";
import type { EmailContent } from "@/lib/email/templates/layout";

const SUBJECT_LENGTH = 120;
const PUSH_BODY_LENGTH = 120;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;
}

const MESSAGE_BOX_STYLE =
  "white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;line-height:1.5;background-color:#f4f4f8;border-radius:8px;padding:12px;margin:0 0 12px 0;color:#1a1a2e;";

export interface PaymentReportAlertInput {
  origin: string;
  userEmail: string;
  category: PaymentReportCategory;
  /** The full stored report text (see buildPaymentReportMessage) — the account and order lines are already in it. */
  message: string;
}

/**
 * The "a learner is having trouble paying" notice sent to admins the moment a
 * payment report is filed. Unlike the Inbox alert it carries the whole report,
 * because everything in it is either the learner's short note or facts the
 * server wrote, and the point is to be able to act without opening anything.
 * Every learner-supplied value is escaped; dir="auto" lets an Arabic note read
 * right-to-left.
 */
export function paymentReportAlertEmail({
  origin,
  userEmail,
  category,
  message,
}: PaymentReportAlertInput): EmailContent {
  const label = PAYMENT_REPORT_CATEGORY_LABELS[category];
  const reportsUrl = `${origin}/admin/reports`;
  const recheckUrl = `${origin}/billing/return`;

  const bodyHtml = `
    <p style="margin:0 0 12px 0;"><strong>${escapeHtml(userEmail)}</strong> reported a payment problem:</p>
    <pre dir="auto" style="${MESSAGE_BOX_STYLE}">${escapeHtml(message)}</pre>
    <p style="margin:0 0 8px 0;">Reply from Admin &gt; Reports; the reply goes to the learner's account email.</p>
    <p style="margin:0;">If they say they paid, ask them to open <a href="${escapeHtml(recheckUrl)}" style="color:#5b45e0;">${escapeHtml(recheckUrl)}</a> while signed in. It asks Wayl again and grants Premium if the payment went through.</p>
  `;

  return {
    subject: truncate(`Payment problem: ${label} — ${userEmail}`, SUBJECT_LENGTH),
    html: renderEmailLayout({
      previewText: `${userEmail}: ${label}`,
      heading: "Payment problem reported",
      bodyHtml,
      ctaLabel: "Open Reports",
      ctaUrl: reportsUrl,
    }),
    text: `${userEmail} reported a payment problem:\n\n${message}\n\nReply from Admin > Reports: ${reportsUrl}\n\nIf they say they paid, ask them to open ${recheckUrl} while signed in. It asks Wayl again and grants Premium if the payment went through.`,
  };
}

/** The push body for a payment report: who and what, short enough for a lock screen. */
export function paymentReportPushBody(userEmail: string, category: PaymentReportCategory): string {
  return truncate(`${userEmail}: ${PAYMENT_REPORT_CATEGORY_LABELS[category]}`, PUSH_BODY_LENGTH);
}

export interface PaymentAlertExplanation {
  title: string;
  meaning: string;
  action: string;
}

const MISMATCH: PaymentAlertExplanation = {
  title: "A payment doesn't match its order",
  meaning:
    "Wayl reports a completed payment whose amount, currency or id differs from the order, so Premium was NOT granted.",
  action:
    "Open the payment in the Wayl dashboard and compare it with the order below. If the payment is genuine the order needs a manual fix; keep the reference handy.",
};

const KNOWN_ALERTS: Record<string, PaymentAlertExplanation> = {
  checkout_link_creation_failed: {
    title: "Wayl didn't create a payment link",
    meaning: "A learner pressed pay but Wayl could not create the link, so nothing was charged.",
    action:
      "Check Wayl's status and that the API key is still valid. The learner saw an error and can try again.",
  },
  paid_without_completion_time: {
    title: "Wayl says paid but gave no completion time",
    meaning: "Premium is held back until Wayl reports when the payment completed.",
    action: "Look the payment up in the Wayl dashboard; the next check usually settles it.",
  },
  reconcile_batch_lookup_failed: {
    title: "The background re-check couldn't reach Wayl",
    meaning:
      "Open orders were not re-checked this time; learners who paid are still covered by the webhook and the return page.",
    action: "If this repeats, check Wayl's status and the API key.",
  },
  unknown_provider_status: {
    title: "Wayl returned a status we don't recognise",
    meaning: "The order is left waiting, and nobody is charged or granted anything because of it.",
    action: "Look the payment up in the Wayl dashboard to see what its status means.",
  },
  user_not_found: {
    title: "Paid, but the account no longer exists",
    meaning:
      "The learner deleted their account after paying, so there was nobody to grant Premium to.",
    action: "Decide whether to contact them; the payment itself is real.",
  },
  needs_review: {
    title: "An order is waiting for review",
    meaning: "The payment system stopped on this order instead of guessing.",
    action: "Compare the order below with the payment in the Wayl dashboard.",
  },
  fulfillment_mismatch: MISMATCH,
  amount_mismatch: MISMATCH,
  currency_mismatch: MISMATCH,
  reference_mismatch: MISMATCH,
  provider_payment_id_mismatch: MISMATCH,
  mismatch: MISMATCH,
};

export function describePaymentAlert(code: string): PaymentAlertExplanation {
  return (
    KNOWN_ALERTS[code] ?? {
      title: `Payment alert: ${code}`,
      meaning: "The payment system flagged something unusual.",
      action:
        "Look the order up with the query below and compare it with the payment in the Wayl dashboard.",
    }
  );
}

export interface PaymentSystemAlertInput {
  code: string;
  referenceId: string;
  detail?: string;
}

/** A reference that came from an order we created, so it is safe to put in the lookup query shown to the admin. */
function isOrderReference(referenceId: string): boolean {
  return /^ss_[0-9a-f]{32}$/.test(referenceId);
}

/**
 * Sent when the payment system itself notices something it cannot settle on
 * its own (a payment taken but not granted, a mismatch, Wayl failing) — so a
 * problem reaches the admins even when nobody has reported it.
 */
export function paymentSystemAlertEmail({
  code,
  referenceId,
  detail,
}: PaymentSystemAlertInput): EmailContent {
  const explanation = describePaymentAlert(code);
  const lookup = isOrderReference(referenceId)
    ? `select * from payment_orders where reference_id = '${referenceId}';`
    : null;

  const facts = [
    `Code: ${code}`,
    referenceId === "batch" ? null : `Order reference: ${referenceId}`,
    detail ? `Detail: ${detail}` : null,
  ].filter((line): line is string => line !== null);

  const bodyHtml = `
    <p style="margin:0 0 12px 0;font-weight:600;color:#1a1a2e;">${escapeHtml(explanation.title)}</p>
    <p style="margin:0 0 12px 0;">${escapeHtml(explanation.meaning)}</p>
    <p style="margin:0 0 12px 0;"><strong>What to do:</strong> ${escapeHtml(explanation.action)}</p>
    <pre style="${MESSAGE_BOX_STYLE}">${escapeHtml(facts.join("\n"))}${lookup ? `\n\nSupabase SQL editor:\n${escapeHtml(lookup)}` : ""}</pre>
  `;

  return {
    subject: truncate(`Payment needs attention: ${explanation.title}`, SUBJECT_LENGTH),
    html: renderEmailLayout({
      previewText: explanation.meaning,
      heading: "A payment needs attention",
      bodyHtml,
    }),
    text: `${explanation.title}\n\n${explanation.meaning}\n\nWhat to do: ${explanation.action}\n\n${facts.join("\n")}${lookup ? `\n\nSupabase SQL editor:\n${lookup}` : ""}`,
  };
}

/** The push body for a system alert: the plain-English title, short enough for a lock screen. */
export function paymentSystemAlertPushBody(code: string): string {
  return truncate(describePaymentAlert(code).title, PUSH_BODY_LENGTH);
}
