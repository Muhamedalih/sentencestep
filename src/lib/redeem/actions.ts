"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { track } from "@/lib/analytics/track";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { getRolloutAccess } from "@/lib/rollouts/queries";
import { clientIpFrom } from "@/lib/security/client-ip";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";

import { redeemForLearner } from "./service";
import type { RedeemOutcome } from "./service";
import { createRedeemCalls } from "./store";

/**
 * The "I have a code" box. The learner is the signed-in session's, the country is the server's own
 * reading of the request (never a header the browser can set), and the address is hashed inside the
 * service before it is kept. Closed unless the Permissions page opens "Premium codes" to this learner;
 * until the tables and the secret exist it answers "unavailable". Nothing here logs or keeps the code.
 */
export async function redeemCodeAction(rawCode: string): Promise<RedeemOutcome> {
  const user = await getCurrentUser();
  if (!user || !isServiceRoleConfigured()) return { status: "unavailable" };
  if (!(await getRolloutAccess()).redeemCodes) return { status: "unavailable" };

  const requestHeaders = await headers();
  const outcome = await redeemForLearner(
    {
      userId: user.id,
      rawCode: typeof rawCode === "string" ? rawCode.slice(0, 200) : "",
      country: resolvePricingCountry(requestHeaders).country,
      address: clientIpFrom(requestHeaders),
    },
    {
      pepper: process.env.REDEEM_CODE_PEPPER,
      calls: createRedeemCalls(),
      onError: (error) => console.error("[redeem] the database call failed", error),
    },
  );

  // A typo never reached the database and is not a try; everything else is, and is counted.
  if (outcome.status !== "bad_format") {
    void track(
      {
        name: "REDEEM_CODE_SUBMITTED",
        category: "PREMIUM",
        properties: { outcome: outcome.status },
      },
      user.id,
    );
  }
  if (outcome.status === "redeemed") {
    void track(
      {
        name: "REDEEM_CODE_SUCCEEDED",
        category: "PREMIUM",
        properties: { days: outcome.days, extendedExisting: outcome.extendedExisting },
      },
      user.id,
    );
    revalidatePath("/upgrade");
    revalidatePath("/learn", "layout");
  }
  return outcome;
}
