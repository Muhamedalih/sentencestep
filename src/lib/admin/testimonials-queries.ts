import { createClient } from "@/lib/supabase/server";

export type TestimonialStatus = "pending" | "published" | "dismissed";

export interface AdminTestimonial {
  id: string;
  displayName: string | null;
  rating: number;
  comment: string;
  locale: string | null;
  status: TestimonialStatus;
  createdAt: string;
}

/**
 * Admin reads for Testimonials — the session-aware client, not a
 * service-role one. app_testimonials' RLS grants is_admin() sessions
 * unrestricted access (see 20250309000000_app_testimonials.sql), so no
 * service-role client is needed here, matching Reports' own list.
 */
export async function listTestimonials(): Promise<AdminTestimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_testimonials")
    .select("id, display_name, rating, comment, locale, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    rating: row.rating,
    comment: row.comment,
    locale: row.locale,
    status: row.status,
    createdAt: row.created_at,
  }));
}

/** Powers the admin nav badge — count of testimonials nobody has reviewed yet. */
export async function countPendingTestimonials(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("app_testimonials")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw error;
  return count ?? 0;
}
