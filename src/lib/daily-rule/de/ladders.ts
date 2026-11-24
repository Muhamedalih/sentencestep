/** The three ladders of the German rule of the day (the rules of each level, in the order they are opened). */

import { ladderOf, type RuleSpec } from "../ladder";

import { DE_SYLLABUS } from "./syllabus";

export const DE_A1_LADDER: readonly RuleSpec[] = ladderOf("A1", DE_SYLLABUS);
export const DE_A2_LADDER: readonly RuleSpec[] = ladderOf("A2-B1", DE_SYLLABUS);
export const DE_B2_LADDER: readonly RuleSpec[] = ladderOf("B2", DE_SYLLABUS);
