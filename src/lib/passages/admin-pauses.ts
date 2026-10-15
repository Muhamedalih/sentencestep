import { loadPassageSentences } from "@/lib/passages/narration";
import { pauseMarksForSentences } from "@/lib/passages/narration-plan";
import type { PauseMark } from "@/lib/passages/narration-pauses";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Where the narrator will pause, for the admin's eyes only. The reader shows
 * these as small dots between the words (see PassageText) to the admin and to
 * nobody else; a learner reads the line as written. Computed on the server from
 * the stored lines, with the very same rules the narration uses (see
 * narration-plan.ts), so what the admin sees is exactly what the voice will be
 * asked to do — and, being read here and never from the learner's passage, it
 * never reaches a learner's browser.
 *
 * The pauses of one passage, keyed by the id of the sentence that carries them.
 * Empty when the lines can't be read: the reader is fine without the dots.
 */
export async function pauseMarksFor(passageId: string): Promise<Record<string, PauseMark>> {
  try {
    return pauseMarksForSentences(await loadPassageSentences(createServiceRoleClient(), passageId));
  } catch (error) {
    console.error("[passages] pauseMarksFor failed", error);
    return {};
  }
}
