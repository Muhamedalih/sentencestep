/**
 * What the rules added to the A2–B1 syllabus teach (a2-09 ... a2-60), one file per group of units, merged here.
 * The first eight A2–B1 rules (a2-01 ... a2-08) are in teach.ts.
 */

import { TEACH_A2_CLAUSES } from "./teach-a2-clauses";
import { TEACH_A2_MODALS } from "./teach-a2-modals";
import { TEACH_A2_NOUNS } from "./teach-a2-nouns";
import { TEACH_A2_TENSES } from "./teach-a2-tenses";
import type { RuleTeach } from "./teach-types";

export const TEACH_A2: Readonly<Record<string, RuleTeach>> = {
  ...TEACH_A2_TENSES,
  ...TEACH_A2_MODALS,
  ...TEACH_A2_NOUNS,
  ...TEACH_A2_CLAUSES,
};
