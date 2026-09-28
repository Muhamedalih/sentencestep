import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Public reads for the marketing homepage's Testimonials section — the
 * anonymous public client, same reasoning as fetchBookRatingSummaries: the
 * 20250309000000_app_testimonials.sql migration's public SELECT policy only
 * ever exposes status = 'published' rows, so this can never leak a pending
 * or dismissed submission. Swallows errors (never throws) rather than
 * failing the whole homepage — a deploy landing before that migration runs
 * on this environment's live Supabase project must degrade to "no
 * testimonials shown yet", never a broken page.
 */
export interface PublishedTestimonial {
  id: string;
  displayName: string | null;
  rating: number;
  comment: string;
}

const MAX_TESTIMONIALS = 6;

export async function fetchPublishedTestimonials(): Promise<PublishedTestimonial[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("app_testimonials")
    .select("id, display_name, rating, comment")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(MAX_TESTIMONIALS);

  if (error) {
    console.error("[testimonials] fetchPublishedTestimonials failed", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    rating: row.rating,
    comment: row.comment,
  }));
}
