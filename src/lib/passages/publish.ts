import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Keeps every passage's word lesson out of Word Lists.
 *
 * A passage's words live in an ordinary Word Lists group (passages.word_group_id),
 * and Word Lists shows learners only groups whose status is "published". These
 * groups are the passage's own summary, not a topic of the library, so they stay
 * "draft" for everybody: they never appear in Word Lists, and the passage page
 * offers no "practice these words" link to a learner (an admin still opens the
 * lesson from the passage, via the admin preview). The words themselves are read
 * for the passage by the server, so the passage's own words screen is unaffected.
 *
 * Only ever touches the groups a passage points at, and never an "archived"
 * one (an admin retired it on purpose). Returns an error message instead of
 * throwing: the change that called this is already saved by the time it runs, and
 * a failure here must be reported, not turn a saved change into a lost one.
 */
export async function syncPassageWordGroups(): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();

    const { data: rows, error } = await supabase
      .from("passages")
      .select("word_group_id")
      .not("word_group_id", "is", null);
    // The passages migration has not been applied to this environment: there is nothing to keep in step.
    if (error?.code === "PGRST205" || error?.code === "42P01") return null;
    if (error) throw error;

    const groupIds = (rows ?? []).flatMap((row) => (row.word_group_id ? [row.word_group_id] : []));
    if (groupIds.length === 0) return null;

    const { error: updateError } = await supabase
      .from("word_groups")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .in("id", groupIds)
      .eq("status", "published");
    if (updateError) throw updateError;

    return null;
  } catch (error) {
    console.error("[passages] syncPassageWordGroups failed", error);
    return "Couldn't hide the word lessons made from the passages.";
  }
}
