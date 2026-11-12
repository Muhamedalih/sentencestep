/**
 * The tabs of the one Words page («الكلمات», the wordsPage permission): Topics (the Word Lists
 * library), Core («كلمات الموقع الأساسية») and Saved (the words saved with the star). Topics and Core
 * are two views of the page `/learn/word-lists`; Saved is its own page, `/learn/words/saved`, drawn
 * under the same title and tabs. A tab is only offered when the learner has what it shows. Pure and
 * client-safe.
 */

export const WORDS_TABS = ["groups", "core", "saved"] as const;
export type WordsTab = (typeof WORDS_TABS)[number];

/** What the learner has: the Core tab needs the words bank, the Saved tab the saved words. */
export interface WordsTabAvailability {
  core: boolean;
  saved: boolean;
}

/** The tabs to draw, in order. Topics is always there; with nothing else to show the page has no tabs at all (see `showsTabs`). */
export function availableTabs(available: WordsTabAvailability): WordsTab[] {
  return [
    "groups",
    ...(available.core ? (["core"] as const) : []),
    ...(available.saved ? (["saved"] as const) : []),
  ];
}

/** A bar of one tab is not a bar. */
export function showsTabs(available: WordsTabAvailability): boolean {
  return availableTabs(available).length > 1;
}

/** Where a tab leads. */
export function tabHref(tab: WordsTab): string {
  if (tab === "core") return "/learn/word-lists?tab=core";
  if (tab === "saved") return "/learn/words/saved";
  return "/learn/word-lists";
}

/**
 * Which view of `/learn/word-lists` a `?tab=` asks for: Core when it says so and the learner has it,
 * otherwise Topics (also for any other value, and for "saved", which is a page of its own).
 */
export function parseListsTab(value: unknown, available: WordsTabAvailability): "groups" | "core" {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "core" && available.core ? "core" : "groups";
}
