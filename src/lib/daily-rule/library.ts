/**
 * The rule library («قواعدي»): every rule a learner has met, as its list page shows them. Pure: the server
 * reads the learner's rule rows and their level; this decides what is listed, in what order, and how each
 * rule stands. A rule is "due" when its day has come (it is asked again at the end of Today), "held" once
 * it stands at three clean answers on three different days, and "learning" before that.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

import type { RuleSpec } from "./ladder";
import { ALL_RULES, LEVEL_LABEL, LEVEL_NUMBER, ladderForLevel } from "./levels";
import { isRuleDue, isRuleHeld, RULE_HELD_STRENGTH } from "./schedule";
import { inLocale, teachFor } from "./teach";
import type { RuleStateRow } from "./visit";

export type LibraryStatus = "due" | "held" | "learning";

export interface LibraryRule {
  id: string;
  title: string;
  /** The level's name ("A1", "A2–B1", "B2"). */
  levelLabel: string;
  /** The rule's idea in the learner's language (Arabic until one is chosen); empty for a rule with no teaching. */
  idea: string;
  status: LibraryStatus;
  /** How many of the three clean days the rule has: 0 to 3, three meaning held. */
  dots: number;
}

export interface Library {
  /** The rules due today, the one that has waited longest first. */
  due: LibraryRule[];
  /** The other rules the learner has met, in the order of the ladders. */
  kept: LibraryRule[];
  /** Every rule the learner has met: the due ones and the others. */
  met: number;
  /** The levels the met rules belong to; a list with more than one shows the level on every row. */
  levels: string[];
  /** The learner's own level: how many of its rules are met, how many it has, and the titles still ahead. Null when the level has no ladder. */
  current: { label: string; met: number; total: number; upcoming: string[] } | null;
}

/** The library of one learner on one day. A row whose rule is not on any ladder (an old id) is left out. */
export function buildLibrary(input: {
  states: readonly RuleStateRow[];
  /** The learner's today (YYYY-MM-DD). */
  today: string;
  /** The learner's level (1 = A1, 2 = A2–B1, 3 = B2). */
  level: number;
  locale: SupportLocale | null;
}): Library {
  const states = new Map(input.states.map((row) => [row.ruleId, row] as const));
  const metRules = ALL_RULES.filter((rule) => states.has(rule.id));

  const entry = (rule: RuleSpec): LibraryRule => {
    const state = states.get(rule.id)!;
    const teach = teachFor(rule.id);
    return {
      id: rule.id,
      title: rule.title,
      levelLabel: LEVEL_LABEL[LEVEL_NUMBER[rule.level]] ?? rule.level,
      idea: teach ? inLocale(teach.idea, input.locale) : "",
      status: isRuleDue(state, input.today)
        ? "due"
        : isRuleHeld(state.strength)
          ? "held"
          : "learning",
      dots: Math.max(0, Math.min(Math.trunc(state.strength), RULE_HELD_STRENGTH)),
    };
  };

  const all = metRules.map(entry);
  // The sort is stable, so rules due on the same day stay in the order of the ladder.
  const due = all
    .filter((rule) => rule.status === "due")
    .sort((a, b) => states.get(a.id)!.dueOn.localeCompare(states.get(b.id)!.dueOn));

  const ladder = ladderForLevel(input.level);
  return {
    due,
    kept: all.filter((rule) => rule.status !== "due"),
    met: all.length,
    levels: [...new Set(all.map((rule) => rule.levelLabel))],
    current: ladder
      ? {
          label: LEVEL_LABEL[input.level] ?? "",
          met: ladder.filter((rule) => states.has(rule.id)).length,
          total: ladder.length,
          upcoming: ladder.filter((rule) => !states.has(rule.id)).map((rule) => rule.title),
        }
      : null,
  };
}
