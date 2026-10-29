/**
 * What the rules added to the B2 syllabus teach (b2-08 ... b2-45), one file per group of units, merged here.
 * The first seven B2 rules (b2-01 ... b2-07) are in teach.ts.
 */

import { TEACH_B2_LINKING } from "./teach-b2-linking";
import { TEACH_B2_PASSIVE } from "./teach-b2-passive";
import { TEACH_B2_TENSES } from "./teach-b2-tenses";
import type { RuleTeach } from "./teach-types";

export const TEACH_B2: Readonly<Record<string, RuleTeach>> = {
  ...TEACH_B2_TENSES,
  ...TEACH_B2_PASSIVE,
  ...TEACH_B2_LINKING,
};
