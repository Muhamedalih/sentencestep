import { sanitizeFeatureConfig } from "@/lib/features/config";
import type { FeatureState } from "@/lib/features/config";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Keeps each passage's word lesson in step with the Passages switch.
 *
 * A passage's words live in an ordinary Word Lists group (passages.word_group_id),
 * and Word Lists shows learners only groups whose status is "published". So
 * while the section is Off or Admin preview — or the passage itself is a draft — those
 * groups stay "draft" — an
 * admin can open them from the passage (via the admin preview), nobody else
 * can see them — and the moment the section goes On for everyone they are
 * published and appear in Word Lists like any other topic, each with its passage
 * (a passage an admin holds back as a draft keeps its lesson hidden too). Taking the
 * section back to Admin preview or Off hides them again.
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
/** A passage's word lesson is open in Word Lists only while the section is On for everyone AND the passage itself is published. */
export function wordGroupStatusFor(
  switchState: FeatureState,
  passageStatus: string,
): "draft" | "published" {
  return switchState === "on" && passageStatus === "published" ? "published" : "draft";
}

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
      .select("word_group_id, status")
      .not("word_group_id", "is", null);
    // The passages migration has not been applied to this environment: there is nothing to keep in step.
    if (error?.code === "PGRST205" || error?.code === "42P01") return null;
    if (error) throw error;

    const idsByStatus: Record<"draft" | "published", string[]> = { draft: [], published: [] };
    for (const row of rows ?? []) {
      if (row.word_group_id)
        idsByStatus[wordGroupStatusFor(state, row.status)].push(row.word_group_id);
    }

    for (const status of ["draft", "published"] as const) {
      if (idsByStatus[status].length === 0) continue;
      const { error: updateError } = await supabase
        .from("word_groups")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", idsByStatus[status])
        .neq("status", "archived");
      if (updateError) throw updateError;
    }

    return null;
  } catch (error) {
    console.error("[passages] syncPassageWordGroups failed", error);
    return "Couldn't update the word lessons made from the passages.";
  }
}
