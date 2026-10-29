/**
 * Plans one visit to the rule of the day, from what the learner has just read and what they have
 * already learned. Pure: the server gathers the texts, the recordings and the schedule; this decides.
 *
 * A visit is at most one new rule (the card, taught from the story just read) and at most two
 * questions on earlier rules. It never stacks more: the rule waits for its day rather than piling up.
 */

import { A1_LADDER, type RuleSpec } from "./ladder";
import { candidatesFor } from "./matchers";
import { RULE_CATCH_UP_DUE, RULE_INTERLEAVE_AFTER, isRuleDue, isRuleHeld } from "./schedule";
import { aroundToken, tokenize, type Token } from "./tokens";

/** The sentences the learner sees on the new rule's card: two to notice, three to type. */
export const NOTICE_SENTENCES = 2;
export const LEARN_ITEMS = 3;
/** At most this many questions on earlier rules in one visit. */
export const RECALL_LIMIT = 2;
/** A1 sentences are short: a longer one is not a first grammar example. */
export const MAX_SENTENCE_WORDS = 14;

/** A sentence with a recording the learner can hear (the stored clip, never the browser's voice). */
export interface SourceSentence {
  id: string;
  text: string;
  audioUrl: string;
}

export interface RuleStateRow {
  ruleId: string;
  strength: number;
  dueOn: string;
  /** The learner-local day the rule was last answered (used to ask at most one earlier-rule visit a day). */
  lastReviewedOn?: string;
  /** The learner-local day the rule was answered for the first time: a rule first seen today is the day's new card. */
  firstSeenOn?: string;
}

/** One sentence with its blank: the answer is `answer`, the rest of the sentence is shown around it. */
export interface ItemSpec {
  ruleId: string;
  sentenceId: string;
  /** The whole sentence, as written. */
  text: string;
  before: string;
  answer: string;
  after: string;
  audioUrl: string;
}

export interface RecallTask {
  kind: "recall" | "interleave";
  ruleId: string;
  item: ItemSpec;
}

export interface LearnTask {
  ruleId: string;
  /** "story": the rule shows in the story just read; "review": a rule due for review, shown in that story. */
  source: "story" | "review";
  notice: ItemSpec[];
  items: ItemSpec[];
}

export interface RuleVisit {
  recall: RecallTask[];
  learn: LearnTask | null;
  /** How many rules are held before this visit. */
  held: number;
  /** Why no new rule is taught today when one could have been: "catch-up" or "no-text". */
  pause: "catch-up" | "no-text" | null;
}

export interface PlanInput {
  /** The learner's today (YYYY-MM-DD). */
  today: string;
  states: readonly RuleStateRow[];
  /** The text the learner has just read: the story's sentences that have a recording. */
  source: readonly SourceSentence[];
  /** The learner's finished A1 sentences with recordings: where earlier rules are asked from. */
  recallPool: readonly SourceSentence[];
  /** Makes the choice deterministic per learner and per day. */
  seed: string;
  ladder?: readonly RuleSpec[];
  /** The longest sentence a rule may be asked from (MAX_WORDS_BY_LEVEL in levels.ts). */
  maxWords?: number;
}

interface Hit {
  sentence: SourceSentence;
  token: Token;
}

/** FNV-1a, 32 bits: a stable number for a string (the same learner and day always pick the same item). */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

function firstHit(rule: RuleSpec, sentence: SourceSentence, maxWords: number): Hit | null {
  if (wordCount(sentence.text) > maxWords) return null;
  const tokens = tokenize(sentence.text);
  const [index] = candidatesFor(rule.match, tokens, sentence.text);
  if (index === undefined) return null;
  return { sentence, token: tokens[index]! };
}

function hitsIn(rule: RuleSpec, pool: readonly SourceSentence[], maxWords: number): Hit[] {
  const hits: Hit[] = [];
  for (const sentence of pool) {
    const hit = firstHit(rule, sentence, maxWords);
    if (hit) hits.push(hit);
  }
  return hits;
}

function itemFor(rule: RuleSpec, hit: Hit): ItemSpec {
  const { before, after } = aroundToken(hit.sentence.text, hit.token);
  return {
    ruleId: rule.id,
    sentenceId: hit.sentence.id,
    text: hit.sentence.text,
    before,
    answer: hit.token.text,
    after,
    audioUrl: hit.sentence.audioUrl,
  };
}

/**
 * The new rule's card: the first two sentences show the form (noticing), the next three are typed.
 * With fewer sentences the typed ones reuse the first, so a rule with three sentences still gets three
 * questions and never fewer.
 */
function learnFrom(rule: RuleSpec, source: "story" | "review", hits: readonly Hit[]): LearnTask {
  const notice = hits.slice(0, NOTICE_SENTENCES);
  const rest = hits.slice(NOTICE_SENTENCES);
  const typed = (rest.length >= LEARN_ITEMS ? rest : [...rest, ...hits]).slice(0, LEARN_ITEMS);
  return {
    ruleId: rule.id,
    source,
    notice: notice.map((hit) => itemFor(rule, hit)),
    items: typed.map((hit) => itemFor(rule, hit)),
  };
}

/** One earlier-rule question from the learner's own finished texts, avoiding today's sentences when it can. */
function recallItem(
  rule: RuleSpec,
  pool: readonly SourceSentence[],
  avoid: ReadonlySet<string>,
  seed: string,
  maxWords: number,
): ItemSpec | null {
  const hits = hitsIn(rule, pool, maxWords);
  if (hits.length === 0) return null;
  const fresh = hits.filter((hit) => !avoid.has(hit.sentence.id));
  const list = fresh.length > 0 ? fresh : hits;
  return itemFor(rule, list[hash(`${seed}|${rule.id}`) % list.length]!);
}

/** The visit for one learner on one day. */
export function planRuleVisit(input: PlanInput): RuleVisit {
  const rules = [...(input.ladder ?? A1_LADDER)].sort((a, b) => a.order - b.order);
  const maxWords = input.maxWords ?? MAX_SENTENCE_WORDS;
  const ruleById = new Map(rules.map((rule) => [rule.id, rule] as const));
  const states = new Map(
    input.states.map((row) => [row.ruleId, { strength: row.strength, dueOn: row.dueOn }] as const),
  );

  const held = rules.filter((rule) => isRuleHeld(states.get(rule.id)?.strength ?? -1));
  const due = rules
    .filter((rule) => isRuleDue(states.get(rule.id), input.today))
    .sort(
      (a, b) => states.get(a.id)!.dueOn.localeCompare(states.get(b.id)!.dueOn) || a.order - b.order,
    );
  const fresh = rules.filter((rule) => !states.has(rule.id));

  // The new rule: the first rule (in ladder order) that the story just read shows. A rule that has not
  // been met yet comes first; a rule due for review is the fallback. Nothing new while three or more
  // rules are due: the learner catches up first.
  let learn: LearnTask | null = null;
  let pause: RuleVisit["pause"] = null;
  if (due.length >= RULE_CATCH_UP_DUE) {
    pause = "catch-up";
  } else {
    for (const [pool, source] of [
      [fresh, "story"],
      [due, "review"],
    ] as const) {
      for (const rule of pool) {
        const hits = hitsIn(rule, input.source, maxWords);
        if (hits.length >= LEARN_ITEMS) {
          learn = learnFrom(rule, source, hits);
          break;
        }
      }
      if (learn) break;
    }
    if (!learn) pause = "no-text";
  }

  // Earlier rules due today, oldest due first, never the rule being taught now.
  const avoid = new Set(input.source.map((sentence) => sentence.id));
  const recallSeed = `${input.seed}|${input.today}`;
  const recall: RecallTask[] = [];
  for (const rule of due) {
    if (recall.length >= RECALL_LIMIT) break;
    if (learn?.ruleId === rule.id) continue;
    const item = recallItem(rule, input.recallPool, avoid, recallSeed, maxWords);
    if (item) recall.push({ kind: "recall", ruleId: rule.id, item });
  }

  // Interleaving: once enough rules are held, a held rule of the same family is asked too, after the
  // new card. The family matters: past simple against present perfect is where learners mix rules up.
  if (learn && held.length >= RULE_INTERLEAVE_AFTER && recall.length < RECALL_LIMIT) {
    const taught = ruleById.get(learn.ruleId);
    const used = new Set([learn.ruleId, ...recall.map((task) => task.ruleId)]);
    const others = held.filter((rule) => !used.has(rule.id));
    const ordered = [
      ...others.filter((rule) => rule.family === taught?.family),
      ...others.filter((rule) => rule.family !== taught?.family),
    ];
    for (const rule of ordered) {
      const item = recallItem(rule, input.recallPool, avoid, `${recallSeed}|mix`, maxWords);
      if (item) {
        recall.push({ kind: "interleave", ruleId: rule.id, item });
        break;
      }
    }
  }

  return { recall, learn, held: held.length, pause };
}

/**
 * The day's session again, for the repeat button on Home's rule row once today's rule is answered: the card of
 * the rule first seen today (from the text the row names, when that text still shows it) and the questions on
 * the rules reviewed today, from the learner's own finished texts. Pure, like planRuleVisit; the runner records
 * nothing in this mode, so the schedule stays as the day left it.
 */
export function planRedoVisit(input: PlanInput): RuleVisit {
  const rules = [...(input.ladder ?? A1_LADDER)].sort((a, b) => a.order - b.order);
  const maxWords = input.maxWords ?? MAX_SENTENCE_WORDS;
  const states = new Map(input.states.map((row) => [row.ruleId, row] as const));

  let learn: LearnTask | null = null;
  for (const rule of rules) {
    if (states.get(rule.id)?.firstSeenOn !== input.today) continue;
    const hits = hitsIn(rule, input.source, maxWords);
    if (hits.length >= LEARN_ITEMS) {
      learn = learnFrom(rule, "story", hits);
      break;
    }
  }

  const avoid = new Set(input.source.map((sentence) => sentence.id));
  const recallSeed = `${input.seed}|${input.today}|again`;
  const recall: RecallTask[] = [];
  for (const rule of rules) {
    if (recall.length >= RECALL_LIMIT) break;
    const row = states.get(rule.id);
    if (!row || row.lastReviewedOn !== input.today || row.firstSeenOn === input.today) continue;
    const item = recallItem(rule, input.recallPool, avoid, recallSeed, maxWords);
    if (item) recall.push({ kind: "recall", ruleId: rule.id, item });
  }

  const held = rules.filter((rule) => isRuleHeld(states.get(rule.id)?.strength ?? -1)).length;
  return { recall, learn, held, pause: null };
}

/** True when there is nothing to show: no new card and no question. */
export function isEmptyVisit(visit: RuleVisit): boolean {
  return visit.learn === null && visit.recall.length === 0;
}
