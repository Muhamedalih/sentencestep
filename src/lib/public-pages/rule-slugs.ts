import { ALL_RULES } from "@/lib/daily-rule/levels";
import type { RuleSpec } from "@/lib/daily-rule/ladder";

/** "he / she / it + -s" becomes "he-she-it-s": lower-case ASCII words joined by "-", from the rule's English title. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSlugs(): { byId: Map<string, string>; byUrlSlug: Map<string, RuleSpec> } {
  const byId = new Map<string, string>();
  const byUrlSlug = new Map<string, RuleSpec>();
  for (const rule of ALL_RULES) {
    const base = slugify(rule.title) || rule.id;
    // Two rules with the same words in their titles keep the first one's plain slug; the others carry
    // their id (stable, because ids never change and the order of ALL_RULES is the course's order).
    const slug = byUrlSlug.has(base) ? `${base}-${rule.id}` : base;
    byId.set(rule.id, slug);
    byUrlSlug.set(slug, rule);
  }
  return { byId, byUrlSlug };
}

const SLUGS = buildSlugs();

/** The address segment of a rule's public page ("for-since"). */
export function slugForRule(ruleId: string): string | undefined {
  return SLUGS.byId.get(ruleId);
}

export function ruleForSlug(slug: string): RuleSpec | undefined {
  return SLUGS.byUrlSlug.get(slug);
}
