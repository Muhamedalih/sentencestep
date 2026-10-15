import { sanitizeFeatureConfig } from "@/lib/features/config";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Keeps each passage's word lesson in step with the Passages switch.
 *
 * A passage's words live in an ordinary Word Lists group (passages.word_group_id),
 * and Word Lists shows learners only groups whose status is "published". So
 * while the section is Off or Admin preview those groups stay "draft" — an
 * admin can open them from the passage (via the admin preview), nobody else
 * can see them — and the moment the section goes On for everyone they are
 * published and appear in Word Lists like any other topic. Taking the section
 * back to Admin preview or Off hides them again.
 *
 * The state is read from the SAVED settings (feature_settings), never taken
 * from the caller: the lessons follow what is actually stored, so a save that
 * did not go through can never publish a lesson while the section itself is
 * still hidden.
 *
 * Only ever touches the groups a passage points at, and never an "archived"
 * one (an admin retired it on purpose). Returns an error message instead of
 * throwing: the switch itself is already saved by the time this runs, and a
 * failure here must be reported, not turn a saved setting into a lost one.
 */
export async function syncPassageWordGroups(): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();

    const { data: settings, error: settingsError } = await supabase
      .from("feature_settings")
      .select("config")
      .eq("id", 1)
      .maybeSingle();
    if (settingsError) throw settingsError;
    const state = sanitizeFeatureConfig(settings?.config).features.passages.state;

    const { data: rows, error } = await supabase
      .from("passages")
      .select("word_group_id")
      .not("word_group_id", "is", null);
    // The passages migration has not been applied to this environment: there is nothing to keep in step.
    if (error?.code === "PGRST205" || error?.code === "42P01") return null;
    if (error) throw error;

    const groupIds = [
      ...new Set(
        (rows ?? []).map((row) => row.word_group_id).filter((id): id is string => Boolean(id)),
      ),
    ];
    if (groupIds.length === 0) return null;

    const { error: updateError } = await supabase
      .from("word_groups")
      .update({
        status: state === "on" ? "published" : "draft",
        updated_at: new Date().toISOString(),
      })
      .in("id", groupIds)
      .neq("status", "archived");
    if (updateError) throw updateError;

    return null;
  } catch (error) {
    console.error("[passages] syncPassageWordGroups failed", error);
    return "Couldn't update the word lessons made from the passages.";
  }
}
