"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { createClient } from "@/lib/supabase/server";
import type { TestimonialStatus } from "@/lib/admin/testimonials-queries";

export interface TestimonialActionState {
  error?: string;
}

const VALID_STATUSES: TestimonialStatus[] = ["pending", "published", "dismissed"];

export async function updateTestimonialStatus(
  id: string,
  status: TestimonialStatus,
): Promise<TestimonialActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_testimonials")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Failed to update this testimonial. Please try again." };

  void logAdminAction("testimonial.status_changed", "app_testimonial", id, { status });
  revalidatePath("/admin/testimonials");
  // A status change flips what fetchPublishedTestimonials returns.
  revalidatePath("/");
  return {};
}
