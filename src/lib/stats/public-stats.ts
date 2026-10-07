import { unstable_cache } from "next/cache";

import { NO_SOCIAL_PROOF, buildSocialProof } from "@/lib/stats/social-proof";
import type { SocialProof } from "@/lib/stats/social-proof";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function readSocialProof(): Promise<SocialProof> {
  if (!isSupabaseConfigured()) return NO_SOCIAL_PROOF;
  try {
    const supabase = createServiceRoleClient();
    const [learners, lessons] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("lesson_attempts").select("id", { count: "exact", head: true }),
    ]);
    if (learners.error || lessons.error) return NO_SOCIAL_PROOF;
    return buildSocialProof({ learners: learners.count ?? 0, lessons: lessons.count ?? 0 });
  } catch {
    // Social proof is decoration: a failed count means the line is left out, never an error page.
    return NO_SOCIAL_PROOF;
  }
}

/**
 * The aggregate learner and lesson counts quoted on /upgrade, counted with the
 * service role (only totals ever leave this function) and kept for an hour so
 * the page never runs two table counts per visit.
 */
export const getSocialProof = unstable_cache(readSocialProof, ["social-proof-v1"], {
  revalidate: 3600,
});
