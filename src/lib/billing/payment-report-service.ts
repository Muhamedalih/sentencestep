import {
  MAX_PAYMENT_REPORT_NOTE_LENGTH,
  buildPaymentReportMessage,
  isPaymentReportCategory,
  paymentReportPagePath,
} from "./payment-report";
import type {
  PaymentReportAccess,
  PaymentReportCategory,
  PaymentReportOrder,
} from "./payment-report";

/** Enough for someone to add detail to a report, far too few to turn into a way of flooding the admins. */
export const MAX_PAYMENT_REPORTS_PER_HOUR = 3;

const MAX_PAGE_PATH_LENGTH = 400;

export type SubmitPaymentReportResult =
  | { ok: true }
  | {
      ok: false;
      code: "invalid" | "note_required" | "too_long" | "not_signed_in" | "too_many" | "generic";
    };

export interface PaymentReportDeps {
  getUser(): Promise<{ id: string; email: string | null } | null>;
  /** How many payment reports this learner has filed since `since`. */
  countRecentReports(userId: string, since: Date): Promise<number>;
  /** The learner's real subscription state (never the sitewide free promotion) and their newest orders. */
  loadContext(
    userId: string,
  ): Promise<{ access: PaymentReportAccess; orders: PaymentReportOrder[] }>;
  insertReport(row: {
    userId: string;
    userEmail: string;
    pagePath: string;
    message: string;
  }): Promise<{ ok: boolean }>;
  /** Never throws. */
  notify(input: {
    userEmail: string;
    category: PaymentReportCategory;
    message: string;
  }): Promise<void>;
  now?: () => Date;
}

const UNKNOWN_ACCESS: PaymentReportAccess = {
  isPremium: false,
  plan: "unknown",
  status: "unknown",
  expiresAt: null,
};

function safePagePath(value: unknown): string {
  return typeof value === "string" && value.startsWith("/")
    ? value.slice(0, MAX_PAGE_PATH_LENGTH)
    : "/";
}

/**
 * Files a payment problem report and alerts the admins. Everything about the
 * account and the orders is read here, on the server; the learner only chooses
 * a category and may add a note. Missing context (a database hiccup while
 * looking up the orders, say) never stops the report — an urgent message
 * without order lines is far better than none — and neither does a failed
 * alert, because the report itself is already stored.
 */
export async function filePaymentReport(
  deps: PaymentReportDeps,
  input: { category: unknown; note: unknown; pagePath: unknown },
): Promise<SubmitPaymentReportResult> {
  if (!isPaymentReportCategory(input.category)) return { ok: false, code: "invalid" };
  const category = input.category;

  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > MAX_PAYMENT_REPORT_NOTE_LENGTH) return { ok: false, code: "too_long" };
  if (category === "other" && !note) return { ok: false, code: "note_required" };

  const user = await deps.getUser();
  if (!user || !user.email) return { ok: false, code: "not_signed_in" };

  const now = (deps.now ?? (() => new Date()))();
  try {
    const since = new Date(now.getTime() - 60 * 60_000);
    if ((await deps.countRecentReports(user.id, since)) >= MAX_PAYMENT_REPORTS_PER_HOUR) {
      return { ok: false, code: "too_many" };
    }
  } catch (error) {
    console.error("[payment-report] couldn't count recent reports; filing anyway", error);
  }

  let context: { access: PaymentReportAccess; orders: PaymentReportOrder[] };
  try {
    context = await deps.loadContext(user.id);
  } catch (error) {
    console.error(
      "[payment-report] couldn't load the account's orders; filing without them",
      error,
    );
    context = { access: UNKNOWN_ACCESS, orders: [] };
  }

  const message = buildPaymentReportMessage({ category, note, ...context });
  const stored = await deps.insertReport({
    userId: user.id,
    userEmail: user.email,
    pagePath: paymentReportPagePath(safePagePath(input.pagePath)),
    message,
  });
  if (!stored.ok) return { ok: false, code: "generic" };

  await deps.notify({ userEmail: user.email, category, message });
  return { ok: true };
}
