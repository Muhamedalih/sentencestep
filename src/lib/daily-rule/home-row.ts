/**
 * Where Home's rule row goes, and the level it names. The row is the day's last row (after the words), so
 * its rule comes from the story the learner finished today when that story has a ladder: the same rule the
 * story's own finish screen offered before the row moved here. Without such a story it comes from the
 * learner's own finished texts at their level (the daily task). Null when neither level has a ladder.
 * Pure: the server finds the story and the learner's level; this only decides.
 */

import { hasRuleLadder, LEVEL_LABEL } from "./levels";

export interface RuleRowTarget {
  href: string;
  levelLabel: string;
}

export function ruleRowTarget(input: {
  /** The story finished today (its id and level), or null when there is none. */
  story: { id: string; level: number } | null;
  /** The learner's starting level (1 = A1, 2 = A2–B1, 3 = B2). */
  level: number;
}): RuleRowTarget | null {
  if (input.story && hasRuleLadder(input.story.level)) {
    return {
      href: `/learn/today/rule?daily=1&from=${encodeURIComponent(input.story.id)}`,
      levelLabel: LEVEL_LABEL[input.story.level] ?? "",
    };
  }
  if (hasRuleLadder(input.level)) {
    return { href: "/learn/today/rule?daily=1", levelLabel: LEVEL_LABEL[input.level] ?? "" };
  }
  return null;
}

/**
 * The row's links: where it goes until today's rule is answered (once it is, the row is done and is no longer
 * a link), and where its repeat button goes: the same page, in redo mode once answered (today's session again).
 */
export function ruleRowLinks(
  target: RuleRowTarget,
  answeredToday: boolean,
): { href: string | null; repeatHref: string } {
  return {
    href: answeredToday ? null : target.href,
    repeatHref: answeredToday ? `${target.href}&redo=1` : target.href,
  };
}
