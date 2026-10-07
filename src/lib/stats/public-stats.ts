import { unstable_cache } from "next/cache";

import { NO_CONTENT_STATS, buildContentStats } from "@/lib/stats/content-stats";
import type { ContentStats } from "@/lib/stats/content-stats";
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

async function readContentStats(): Promise<ContentStats> {
  if (!isSupabaseConfigured()) return NO_CONTENT_STATS;
  try {
    const supabase = createServiceRoleClient();
    const [lessons, groups] = await Promise.all([
      supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("word_groups").select("id").eq("status", "published"),
    ]);
    if (lessons.error || groups.error) return NO_CONTENT_STATS;

    const groupIds = (groups.data ?? []).map((group) => group.id);
    let words = 0;
    if (groupIds.length > 0) {
      const wordCount = await supabase
        .from("vocabulary_words")
        .select("id", { count: "exact", head: true })
        .in("group_id", groupIds);
      if (wordCount.error) return NO_CONTENT_STATS;
      words = wordCount.count ?? 0;
    }
    return buildContentStats({
      lessons: lessons.count ?? 0,
      words,
      wordLists: groupIds.length,
    });
  } catch {
    // Like social proof, this is decoration: a failed count means the figures are left out, never an error page.
    return NO_CONTENT_STATS;
  }
}

/**
 * How much is in the library, quoted on /upgrade. Counted with the service
 * role (only totals ever leave this function) and kept for an hour, so the
 * page never runs three table counts per visit.
 */
export const getContentStats = unstable_cache(readContentStats, ["content-stats-v1"], {
  revalidate: 3600,
});
