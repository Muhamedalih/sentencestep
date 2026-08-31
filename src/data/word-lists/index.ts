import { advancedWordGroups } from "@/data/word-lists/advanced";
import { beginnerWordGroups } from "@/data/word-lists/beginner";
import { intermediateWordGroups } from "@/data/word-lists/intermediate";
import type { WordGroup } from "@/types/word-lists";

/**
 * Local dev/test seed data. Read through src/lib/word-lists.ts, not
 * imported directly — same pattern as src/data/lessons/index.ts.
 */
export const wordGroups: WordGroup[] = [
  ...beginnerWordGroups,
  ...intermediateWordGroups,
  ...advancedWordGroups,
];
