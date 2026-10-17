import { A1_PASSAGES_PART_1 } from "@/data/passages/a1-part-1";
import { A1_PASSAGES_PART_2 } from "@/data/passages/a1-part-2";
import { A1_PASSAGES_PART_3 } from "@/data/passages/a1-part-3";
import { A1_PASSAGES_PART_4 } from "@/data/passages/a1-part-4";
import { A1_PASSAGES_PART_5 } from "@/data/passages/a1-part-5";
import { A1_PASSAGES_PART_6 } from "@/data/passages/a1-part-6";
import { A2_PASSAGES_PART_1 } from "@/data/passages/a2-part-1";
import { A2_PASSAGES_PART_2 } from "@/data/passages/a2-part-2";
import { A2_PASSAGES_PART_3 } from "@/data/passages/a2-part-3";
import { A2_PASSAGES_PART_4 } from "@/data/passages/a2-part-4";
import { A2_PASSAGES_PART_5 } from "@/data/passages/a2-part-5";
import { A2_PASSAGES_PART_6 } from "@/data/passages/a2-part-6";
import { B1_PASSAGES_PART_1 } from "@/data/passages/b1-part-1";
import { B1_PASSAGES_PART_2 } from "@/data/passages/b1-part-2";
import { B1_PASSAGES_PART_3 } from "@/data/passages/b1-part-3";
import { B1_PASSAGES_PART_4 } from "@/data/passages/b1-part-4";
import { B1_PASSAGES_PART_5 } from "@/data/passages/b1-part-5";
import { B1_PASSAGES_PART_6 } from "@/data/passages/b1-part-6";
import { B1_PASSAGES_PART_7 } from "@/data/passages/b1-part-7";
import { B2_PASSAGES_PART_1 } from "@/data/passages/b2-part-1";
import { B2_PASSAGES_PART_2 } from "@/data/passages/b2-part-2";
import { B2_PASSAGES_PART_3 } from "@/data/passages/b2-part-3";
import { B2_PASSAGES_PART_4 } from "@/data/passages/b2-part-4";
import { B2_PASSAGES_PART_5 } from "@/data/passages/b2-part-5";
import { B2_PASSAGES_PART_6 } from "@/data/passages/b2-part-6";
import type { PassageSeed } from "@/data/passages/types";

/** Every authored passage, in list order. */
export const PASSAGE_SEEDS: PassageSeed[] = [
  ...A1_PASSAGES_PART_1,
  ...A1_PASSAGES_PART_2,
  ...A1_PASSAGES_PART_3,
  ...A1_PASSAGES_PART_4,
  ...A1_PASSAGES_PART_5,
  ...A1_PASSAGES_PART_6,
  ...A2_PASSAGES_PART_1,
  ...A2_PASSAGES_PART_2,
  ...A2_PASSAGES_PART_3,
  ...A2_PASSAGES_PART_4,
  ...A2_PASSAGES_PART_5,
  ...A2_PASSAGES_PART_6,
  ...B1_PASSAGES_PART_1,
  ...B1_PASSAGES_PART_2,
  ...B1_PASSAGES_PART_3,
  ...B1_PASSAGES_PART_4,
  ...B1_PASSAGES_PART_5,
  ...B1_PASSAGES_PART_6,
  ...B1_PASSAGES_PART_7,
  ...B2_PASSAGES_PART_1,
  ...B2_PASSAGES_PART_2,
  ...B2_PASSAGES_PART_3,
  ...B2_PASSAGES_PART_4,
  ...B2_PASSAGES_PART_5,
  ...B2_PASSAGES_PART_6,
].sort((a, b) => a.level.localeCompare(b.level) || a.order - b.order);

export type { PassageSeed, PassageVoiceAlias } from "@/data/passages/types";
