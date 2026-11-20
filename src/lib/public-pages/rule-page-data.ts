import { LEVEL_LABEL, LEVEL_NUMBER, ALL_RULES, ruleById } from "@/lib/daily-rule/levels";
import type { RuleSpec } from "@/lib/daily-rule/ladder";
import { teachFor } from "@/lib/daily-rule/teach";
import type { RuleNote } from "@/lib/daily-rule/teach-types";
import { unitById } from "@/lib/daily-rule/units";

import { PUBLIC_PAGES_INDEXABLE } from "./flag";
import { RULE_ARTICLES } from "./rule-articles";
import { ruleForSlug, slugForRule } from "./rule-slugs";
import type { RuleArticle } from "./types";

/** A sentence of a rule with its blank: "She has worked here [since] 2018.{hint}" split into the parts the page shows and checks. */
export interface PreparedExample {
  before: string;
  /** The answers that are right; the first one is the one the page shows when it gives the answer. */
  answers: readonly string[];
  after: string;
  /** The short hint some sentences end with ("{see}"), or null. */
  hint: string | null;
  /** The whole sentence with the first answer in place, for the translated list. */
  full: string;
}

export interface RulePageLink {
  href: string;
  title: string;
}

export interface RulePageModel {
  id: string;
  slug: string;
  title: string;
  level: string;
  levelLabel: string;
  unitId: string;
  unitTitleAr: string;
  article: RuleArticle;
  /** The rule's idea in Arabic: the one-line answer at the top of the page. */
  ideaAr: string;
  ideaEn: string;
  right: string;
  wrong: string;
  notes: readonly RuleNote[];
  examples: readonly PreparedExample[];
  previous: RulePageLink | null;
  next: RulePageLink | null;
  /** The other rules of the same unit that have a page, for the "close rules" row. */
  related: readonly RulePageLink[];
}

export function parseExample(raw: string): PreparedExample | null {
  const hintMatch = raw.match(/\s*\{([^}]+)\}\s*$/);
  const hint = hintMatch ? hintMatch[1]! : null;
  const body = hintMatch ? raw.slice(0, hintMatch.index) : raw;
  const match = body.match(/^(.*?)\[([^\]]+)\](.*)$/);
  if (!match) return null;
  const answers = match[2]!
    .split("|")
    .map((answer) => answer.trim())
    .filter(Boolean);
  if (answers.length === 0) return null;
  const before = match[1]!;
  const after = match[3]!;
  return { before, answers, after, hint, full: `${before}${answers[0]}${after}` };
}

/** The path of a rule's page in the language of the public pages. */
export function rulePagePath(locale: string, slug: string): string {
  return `/${locale}/grammar/${slug}`;
}

/** The rules that have a public page (a written article), in the order of the course. */
export function publicRules(): readonly RuleSpec[] {
  return ALL_RULES.filter((rule) => RULE_ARTICLES[rule.id] !== undefined);
}

/** The slugs of the rules that have a public page. */
export function publicRuleSlugs(): readonly string[] {
  return publicRules().flatMap((rule) => {
    const slug = slugForRule(rule.id);
    return slug ? [slug] : [];
  });
}

/** Whether Google and the others are asked to index a rule's page: only when the switch is on AND the rule has its article. */
export function isRuleIndexable(ruleId: string): boolean {
  return PUBLIC_PAGES_INDEXABLE && RULE_ARTICLES[ruleId] !== undefined;
}

export function buildRulePage(slug: string, locale: string): RulePageModel | null {
  const rule = ruleForSlug(slug);
  if (!rule) return null;
  const article = RULE_ARTICLES[rule.id];
  const teach = teachFor(rule.id);
  if (!article || !teach) return null;

  const examples = (teach.items ?? []).flatMap((item) => {
    const parsed = parseExample(item);
    return parsed ? [parsed] : [];
  });

  const asLink = (target: RuleSpec | undefined): RulePageLink | null => {
    if (!target || !RULE_ARTICLES[target.id]) return null;
    const targetSlug = slugForRule(target.id);
    return targetSlug ? { href: rulePagePath(locale, targetSlug), title: target.title } : null;
  };

  // The neighbours are the nearest rules of the course that have a page, not the rules next to it in the list.
  const published = publicRules();
  const at = published.findIndex((candidate) => candidate.id === rule.id);
  const previous = asLink(published[at - 1]);
  const next = asLink(published[at + 1]);
  const related = published
    .filter((candidate) => candidate.unit === rule.unit && candidate.id !== rule.id)
    .slice(0, 3)
    .flatMap((candidate) => {
      const link = asLink(candidate);
      return link ? [link] : [];
    });

  return {
    id: rule.id,
    slug,
    title: rule.title,
    level: rule.level,
    levelLabel: LEVEL_LABEL[LEVEL_NUMBER[rule.level]] ?? rule.level,
    unitId: rule.unit,
    unitTitleAr: unitById(rule.unit)?.title.ar ?? "",
    article,
    ideaAr: teach.idea.ar,
    ideaEn: teach.idea.en,
    right: teach.right,
    wrong: teach.wrong,
    notes: [...teach.notes].sort(noteOrder),
    examples,
    previous,
    next,
    related,
  };
}

const NOTE_RANK: Record<RuleNote["kind"], number> = { mistake: 0, detail: 1, exception: 2 };

function noteOrder(a: RuleNote, b: RuleNote): number {
  return NOTE_RANK[a.kind] - NOTE_RANK[b.kind];
}

/** For the grammar index: the rules that have a page, grouped by level, with their slugs. */
export function publicRulesByLevel(): readonly {
  level: string;
  levelLabel: string;
  rules: readonly { id: string; title: string; slug: string; unitTitleAr: string }[];
}[] {
  const groups = new Map<
    string,
    { id: string; title: string; slug: string; unitTitleAr: string; level: string }[]
  >();
  for (const rule of publicRules()) {
    const slug = slugForRule(rule.id);
    if (!slug) continue;
    const list = groups.get(rule.level) ?? [];
    list.push({
      id: rule.id,
      title: rule.title,
      slug,
      unitTitleAr: unitById(rule.unit)?.title.ar ?? "",
      level: rule.level,
    });
    groups.set(rule.level, list);
  }
  return (["A1", "A2-B1", "B2"] as const).flatMap((level) => {
    const rules = groups.get(level);
    return rules
      ? [
          {
            level,
            levelLabel: LEVEL_LABEL[LEVEL_NUMBER[level]] ?? level,
            rules: rules.map(({ id, title, slug, unitTitleAr }) => ({ id, title, slug, unitTitleAr })),
          },
        ]
      : [];
  });
}

/** True when the rule id is on the course (used by the tests). */
export function isCourseRule(ruleId: string): boolean {
  return ruleById(ruleId) !== undefined;
}
