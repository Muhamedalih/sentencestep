/**
 * The rule of the day above A1: the A2–B1 ladder (level 2) and the B2 ladder (level 3), built from the
 * syllabus (syllabus.ts) the same way as the A1 ladder in ladder.ts.
 */

import { ladderOf, type RuleSpec } from "./ladder";

export const A2_LADDER: readonly RuleSpec[] = ladderOf("A2-B1");

export const B2_LADDER: readonly RuleSpec[] = ladderOf("B2");
