/**
 * The prepared sentences of a rule as questions (items.ts reads them, teach.ts holds them): what a rule is
 * taught and asked with when the learner's own texts do not show it. A prepared sentence has no recording of
 * its own until one is stored (load.ts looks for it), so its question carries no sound until then.
 */

import { parsePrepared, type PreparedItem } from "./items";
import type { RuleSpec } from "./ladder";
import { stripMarks } from "./marks";
import { teachFor } from "./teach";
import type { ItemSpec } from "./visit";

const PARSED = new Map<string, readonly PreparedItem[]>();

/** The sentences of a rule that read as a question (one blank with an answer in it), in the order written. */
function parsedOf(ruleId: string): readonly PreparedItem[] {
  let parsed = PARSED.get(ruleId);
  if (!parsed) {
    parsed = (teachFor(ruleId)?.items ?? [])
      .map((raw) => parsePrepared(raw))
      .filter((item): item is PreparedItem => item !== null);
    PARSED.set(ruleId, parsed);
  }
  return parsed;
}

/** What identifies a prepared sentence (the recording and the word clips are looked up under it). */
export function preparedSentenceId(ruleId: string, index: number): string {
  return `prep:${ruleId}:${index}`;
}

/** Whether a sentence id is a prepared one. */
export function isPreparedId(sentenceId: string): boolean {
  return sentenceId.startsWith("prep:");
}

/** The prepared sentences of a rule as questions, in the order written; none for a rule without any. */
export function preparedItems(rule: Pick<RuleSpec, "id">): ItemSpec[] {
  return parsedOf(rule.id).map((item, index) => ({
    ruleId: rule.id,
    sentenceId: preparedSentenceId(rule.id, index),
    text: item.text,
    before: item.before,
    answer: item.answer,
    answers: item.answers,
    after: item.after,
    ...(item.hint ? { hint: item.hint } : {}),
  }));
}

/**
 * The prepared sentences in the order a rule's card uses them (two to show, three to type, one spare): the
 * rule's own right sentence, which the card already shows above the examples, comes last.
 */
export function preparedItemsForCard(rule: Pick<RuleSpec, "id">): ItemSpec[] {
  const items = preparedItems(rule);
  const right = stripMarks(teachFor(rule.id)?.right ?? "").trim();
  return [
    ...items.filter((item) => item.text.trim() !== right),
    ...items.filter((item) => item.text.trim() === right),
  ];
}
