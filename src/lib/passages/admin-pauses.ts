import { PASSAGE_SEEDS } from "@/data/passages";
import { sentenceIdFor } from "@/lib/passages/ids";
import { wordsBefore } from "@/lib/passages/narration-pauses";
import type { PauseMark } from "@/lib/passages/narration-pauses";
import { narrationPlanFor } from "@/lib/passages/spoken-text";

/**
 * Where the narrator will pause, for the admin's eyes only. The reader shows
 * these as small dots between the words (see PassageText) to the admin and to
 * nobody else; a learner reads the line as written. Computed on the server from
 * the authored data, with the very same rules the audio script uses (see
 * narration-pauses.ts), so what the admin sees is exactly what the voice will
 * be asked to do — and, being the authored data, it never reaches a learner's
 * browser.
 */

/** The pauses of one passage, keyed by the id of the sentence that carries them. */
export function pauseMarksFor(slug: string): Record<string, PauseMark> {
  const seed = PASSAGE_SEEDS.find((candidate) => candidate.slug === slug);
  if (!seed) return {};

  const marks: Record<string, PauseMark> = {};
  seed.sections.forEach((section, sectionIndex) => {
    section.lines.forEach((line, lineIndex) => {
      const { spoken, plan } = narrationPlanFor(line, section.lines[lineIndex - 1]?.en);
      if (!plan) return;
      marks[sentenceIdFor(slug, sectionIndex + 1, lineIndex + 1)] = {
        afterWord: wordsBefore(spoken, plan.at),
        length: plan.length,
      };
    });
  });
  return marks;
}
