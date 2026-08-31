"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { DEV_ADMIN_COOKIE } from "@/lib/admin/constants";

/**
 * Lets a developer flip their own admin status locally to exercise the
 * authorization boundary before any real admin exists — mirrors
 * src/lib/billing/dev-actions.ts exactly. Hard no-ops in production so this
 * can never become a production bypass; isAdmin() applies the same
 * production check when reading the cookie.
 */
export async function devSetAdmin(isAdmin: boolean): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const cookieStore = await cookies();
  if (isAdmin) {
    cookieStore.set(DEV_ADMIN_COOKIE, "true", { httpOnly: true, sameSite: "lax", path: "/" });
  } else {
    cookieStore.delete(DEV_ADMIN_COOKIE);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/upgrade");
}
