/**
 * The rule library («قواعدي»): the whole course as a map, and how far the learner is on it. Pure: the server
 * reads the learner's rule rows and their level; this decides what is listed, in what order, and how each
 * rule stands. A rule is "due" when its day has come (it is asked again at the end of Today), "held" once
 * it stands at three clean answers on three different days, and "learning" before that. The rules the
 * learner has not met yet are on the map too, in the order they will open: the next one is marked, the
 * others are titles only (a rule is taught when its day comes, not read ahead).
 */

import type { SupportLocale } from "@/lib/i18n/locales";

import type { RuleSpec } from "./ladder";
import { LEVEL_LABEL, LEVEL_NUMBER, ladderForLevel, teachingLevel } from "./levels";
import { isRuleDue, isRuleHeld, RULE_HELD_STRENGTH } from "./schedule";
import { inLocale, teachFor } from "./teach";
import { unitTitle } from "./units";
import type { RuleStateRow } from "./visit";

export type LibraryStatus = "due" | "held" | "learning";

/** A rule the learner has met, as the list of today's reviews shows it. */
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

/** One row of the map: a rule met (it opens its page), the next rule to open, or one still ahead (title only). */
export interface MapRule {
  id: string;
  title: string;
  state: LibraryStatus | "next" | "ahead";
  dots: number;
  /** The idea in the learner's language; empty for a rule not met yet. */
  idea: string;
}

export interface LibraryUnit {
  id: string;
  /** The unit's name in the learner's language. */
  title: string;
  met: number;
  total: number;
  /** Shown open when it holds the next rule or a rule due today (on the level the course is on). */
  open: boolean;
  rules: MapRule[];
}

export interface LibraryLevel {
  label: string;
  /** The level the course is on now. */
  current: boolean;
  met: number;
  total: number;
  units: LibraryUnit[];
}

export interface Library {
  /** The rules due today, the one that has waited longest first. */
  due: LibraryRule[];
  /** Every rule the learner has met. */
  met: number;
  /** The levels of the map: the one the course is on, and every other level the learner has met a rule of, A1 first. */
  levels: LibraryLevel[];
  /** The level the course is on: how many of its rules are met and how many it has. Null when the level has no ladder. */
  current: { label: string; met: number; total: number } | null;
}

const LEVEL_NUMBERS = [1, 2, 3] as const;

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
  const teaching = teachingLevel(input.level, new Set(states.keys()));

  const status = (rule: RuleSpec): LibraryStatus => {
    const state = states.get(rule.id)!;
    return isRuleDue(state, input.today) ? "due" : isRuleHeld(state.strength) ? "held" : "learning";
  };
  const dots = (rule: RuleSpec): number =>
    Math.max(0, Math.min(Math.trunc(states.get(rule.id)!.strength), RULE_HELD_STRENGTH));
  const idea = (rule: RuleSpec): string => {
    const teach = teachFor(rule.id);
    return teach ? inLocale(teach.idea, input.locale) : "";
  };

  const dueRules: LibraryRule[] = [];
  let met = 0;
  const levels: LibraryLevel[] = [];

  for (const number of LEVEL_NUMBERS) {
    const ladder = ladderForLevel(number);
    if (!ladder) continue;
    const metHere = ladder.filter((rule) => states.has(rule.id));
    met += metHere.length;
    for (const rule of metHere) {
      if (status(rule) === "due") {
        dueRules.push({
          id: rule.id,
          title: rule.title,
          levelLabel: LEVEL_LABEL[LEVEL_NUMBER[rule.level]] ?? rule.level,
          idea: idea(rule),
          status: "due",
          dots: dots(rule),
        });
      }
    }
    // The map shows the level the course is on, and any other level the learner has met a rule of.
    if (number !== teaching && metHere.length === 0) continue;

    const current = number === teaching;
    const next = ladder.find((rule) => !states.has(rule.id));
    const units: LibraryUnit[] = [];
    for (const rule of ladder) {
      let unit = units.find((candidate) => candidate.id === rule.unit);
      if (!unit) {
        unit = {
          id: rule.unit,
          title: unitTitle(rule.unit, input.locale),
          met: 0,
          total: 0,
          open: false,
          rules: [],
        };
        units.push(unit);
      }
      const isMet = states.has(rule.id);
      const state: MapRule["state"] = isMet
        ? status(rule)
        : rule.id === next?.id
          ? "next"
          : "ahead";
      unit.total += 1;
      if (isMet) unit.met += 1;
      if (current && (state === "next" || state === "due")) unit.open = true;
      unit.rules.push({
        id: rule.id,
        title: rule.title,
        state,
        dots: isMet ? dots(rule) : 0,
        idea: isMet ? idea(rule) : "",
      });
    }
    levels.push({
      label: LEVEL_LABEL[number] ?? "",
      current,
      met: metHere.length,
      total: ladder.length,
      units,
    });
  }

  // The sort is stable, so rules due on the same day stay in the order of the ladders.
  dueRules.sort((a, b) => states.get(a.id)!.dueOn.localeCompare(states.get(b.id)!.dueOn));

  const currentLevel = levels.find((level) => level.current);
  return {
    due: dueRules,
    met,
    levels,
    current: currentLevel
      ? { label: currentLevel.label, met: currentLevel.met, total: currentLevel.total }
      : null,
  };
}
