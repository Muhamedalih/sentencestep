"use server";

import { deriveAccessState } from "@/lib/billing/domain";
import { toPaymentReportOrder } from "@/lib/billing/payment-report";
import { filePaymentReport } from "@/lib/billing/payment-report-service";
import type {
  PaymentReportDeps,
  SubmitPaymentReportResult,
} from "@/lib/billing/payment-report-service";
import { notifyAdminsOfPaymentReport } from "@/lib/billing/payments/admin-alerts";
import { createPaymentStore } from "@/lib/billing/payments/store";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const NEWEST_ORDERS_QUOTED = 3;

/** Service-role reads: a learner can't read payment_orders or other people's reports, and this only ever runs for their own id. */
const realDeps: PaymentReportDeps = {
  async getUser() {
    const user = await getCurrentUser();
    return user ? { id: user.id, email: user.email ?? null } : null;
  },

  async countRecentReports(userId, since) {
    const { count, error } = await createServiceRoleClient()
      .from("problem_reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .like("page_path", "payment:%")
      .gte("created_at", since.toISOString());
    if (error) throw error;
    return count ?? 0;
  },

  async loadContext(userId) {
    const service = createServiceRoleClient();
    const [orders, subscription] = await Promise.all([
      createPaymentStore(service).listRecentOrdersForUser(userId, NEWEST_ORDERS_QUOTED),
      service.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    if (subscription.error) throw subscription.error;

    // The learner's real subscription, not getAccessState(): that one reports
    // everyone as Premium while the sitewide free promotion is on, which would
    // hide exactly what someone fixing a payment needs to see.
    const row = subscription.data;
    const state = deriveAccessState(
      row && {
        plan: row.plan,
        status: row.status,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end,
        providerCustomerId: row.provider_customer_id,
        providerSubscriptionId: row.provider_subscription_id,
      },
    );
    return {
      access: {
        isPremium: state.isPremium,
        plan: state.plan,
        status: state.status,
        expiresAt: state.expiresAt,
      },
      orders: orders.map(toPaymentReportOrder),
    };
  },

  // Filed as the learner (problem_reports' RLS insert policy needs
  // auth.uid() = user_id), the same boundary as the regular "Report a problem".
  async insertReport(row) {
    const supabase = await createClient();
    const record = {
      user_id: row.userId,
      user_email: row.userEmail,
      page_path: row.pagePath,
      message: row.message,
    };

    let { error, status } = await supabase.from("problem_reports").insert(record);
    // status 0 means the request never reached Postgres at all (see
    // submitProblemReport in actions.ts for the full story), so retrying once
    // cannot double a write and is worth it for a report this important.
    if (error && status === 0) {
      console.error("[payment-report] insert timed out, retrying once", error);
      ({ error, status } = await supabase.from("problem_reports").insert(record));
    }
    if (error) {
      console.error("[payment-report] insert failed", { status, error });
      return { ok: false };
    }
    return { ok: true };
  },

  notify: notifyAdminsOfPaymentReport,
};

/**
 * "Problem with your payment?" (see src/components/billing/report-payment-problem.tsx).
 * The learner picks a category and may add a note; the account state and their
 * newest orders are read here and written into the report, and the admins are
 * emailed and pushed the moment it is stored (see filePaymentReport).
 */
export async function submitPaymentReport(input: {
  category: string;
  note: string;
  pagePath: string;
}): Promise<SubmitPaymentReportResult> {
  try {
    return await filePaymentReport(realDeps, input);
  } catch (error) {
    console.error("[payment-report] unexpected failure", error);
    return { ok: false, code: "generic" };
  }
}
