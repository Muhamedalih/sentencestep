import { A1_PASSAGES_PART_1 } from "@/data/passages/a1-part-1";
import { A1_PASSAGES_PART_2 } from "@/data/passages/a1-part-2";
import { A2_PASSAGES_PART_1 } from "@/data/passages/a2-part-1";
import { A2_PASSAGES_PART_2 } from "@/data/passages/a2-part-2";
import { B1_PASSAGES_PART_1 } from "@/data/passages/b1-part-1";
import { B1_PASSAGES_PART_2 } from "@/data/passages/b1-part-2";
import type { PassageSeed } from "@/data/passages/types";

/** Every authored passage, in list order. */
export const PASSAGE_SEEDS: PassageSeed[] = [
  ...A1_PASSAGES_PART_1,
  ...A1_PASSAGES_PART_2,
  ...A2_PASSAGES_PART_1,
  ...A2_PASSAGES_PART_2,
  ...B1_PASSAGES_PART_1,
  ...B1_PASSAGES_PART_2,
].sort((a, b) => a.level.localeCompare(b.level) || a.order - b.order);

export type { PassageSeed, PassageVoiceAlias } from "@/data/passages/types";
