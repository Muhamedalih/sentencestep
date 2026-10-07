import { alertAdmins, withinTime } from "@/lib/admin/alert-admins";
import type { PaymentReportCategory } from "@/lib/billing/payment-report";
import {
  paymentReportAlertEmail,
  paymentReportPushBody,
  paymentSystemAlertEmail,
  paymentSystemAlertPushBody,
} from "@/lib/email/templates/payment-alert";
import { getSiteUrl } from "@/lib/site-url";

import { createAlertThrottle } from "./alert-throttle";
import type { PaymentAlert } from "./fulfillment";

/**
 * How long a request waits for the alert to be handed to the email and push
 * providers. Serverless hosts may freeze a function the moment it responds, so
 * the alert has to be sent before the response (after() is not reliable on this
 * host), but a slow provider must never be allowed to hold a payment page or a
 * webhook for long.
 */
const SYSTEM_ALERT_DEADLINE_MS = 4_000;
const REPORT_ALERT_DEADLINE_MS = 5_000;

const systemAlertThrottle = createAlertThrottle();

/**
 * Tells the admins about something the payment system could not settle by
 * itself (a payment taken but not granted, a mismatch, Wayl failing). Never
 * throws, never waits long, and never repeats the same alert for 30 minutes.
 */
export async function notifyAdminsOfPaymentAlert(alert: PaymentAlert): Promise<void> {
  try {
    if (!systemAlertThrottle.shouldSend(`${alert.code}:${alert.referenceId}`, Date.now())) return;

    await withinTime(
      alertAdmins(
        {
          email: paymentSystemAlertEmail(alert),
          push: {
            title: "A payment needs attention",
            body: paymentSystemAlertPushBody(alert.code),
            url: "/admin",
          },
        },
        { logTag: "payments" },
      ),
      SYSTEM_ALERT_DEADLINE_MS,
    );
  } catch (error) {
    console.error("[payments] couldn't alert admins", error);
  }
}

/** Tells the admins a learner has filed a payment problem report. Never throws, never waits long. */
export async function notifyAdminsOfPaymentReport(input: {
  userEmail: string;
  category: PaymentReportCategory;
  message: string;
}): Promise<void> {
  try {
    await withinTime(
      alertAdmins(
        {
          email: paymentReportAlertEmail({ origin: getSiteUrl(), ...input }),
          push: {
            title: "Payment problem reported",
            body: paymentReportPushBody(input.userEmail, input.category),
            url: "/admin/reports",
          },
        },
        { logTag: "payment-report" },
      ),
      REPORT_ALERT_DEADLINE_MS,
    );
  } catch (error) {
    console.error("[payment-report] couldn't alert admins", error);
  }
}
