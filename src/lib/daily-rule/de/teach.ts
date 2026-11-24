/**
 * What every German rule teaches, by rule id (de-a1-01 ... de-b2-45): the idea in four languages, a right and a
 * wrong sentence, the notes of the second page, and the prepared sentences. One file per 15 rules, written in the
 * same shape as the English course (../teach.ts) so the card, the library and the practice read both alike.
 */

import type { RuleTeach } from "../teach-types";

import { TEACH_DE_A1_1 } from "./teach-a1-1";
import { TEACH_DE_A1_2 } from "./teach-a1-2";
import { TEACH_DE_A1_3 } from "./teach-a1-3";
import { TEACH_DE_A2_1 } from "./teach-a2-1";
import { TEACH_DE_A2_2 } from "./teach-a2-2";
import { TEACH_DE_A2_3 } from "./teach-a2-3";
import { TEACH_DE_A2_4 } from "./teach-a2-4";
import { TEACH_DE_B2_1 } from "./teach-b2-1";
import { TEACH_DE_B2_2 } from "./teach-b2-2";
import { TEACH_DE_B2_3 } from "./teach-b2-3";

export const TEACH_DE: Readonly<Record<string, RuleTeach>> = {
  ...TEACH_DE_A1_1,
  ...TEACH_DE_A1_2,
  ...TEACH_DE_A1_3,
  ...TEACH_DE_A2_1,
  ...TEACH_DE_A2_2,
  ...TEACH_DE_A2_3,
  ...TEACH_DE_A2_4,
  ...TEACH_DE_B2_1,
  ...TEACH_DE_B2_2,
  ...TEACH_DE_B2_3,
};
