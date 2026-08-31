"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { DEV_PLAN_COOKIE } from "@/lib/billing/access";
import type { Plan } from "@/lib/billing/types";

/**
 * Lets a developer flip between free and premium locally to exercise both
 * experiences before a real payment provider exists — see the Milestone 6
 * scope note in the upgrade page. Hard no-ops in production so this can
 * never become a production bypass; getAccessState() applies the same
 * production check when reading the cookie, so even a manually-crafted
 * cookie against a real deployment is ignored.
 */
export async function devSetPlan(plan: Plan): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const cookieStore = await cookies();
  if (plan === "premium") {
    cookieStore.set(DEV_PLAN_COOKIE, "premium", { httpOnly: true, sameSite: "lax", path: "/" });
  } else {
    cookieStore.delete(DEV_PLAN_COOKIE);
  }

  revalidatePath("/learn", "layout");
  revalidatePath("/upgrade");
}
