/**
 * Where the narrator takes a small breath. A TTS voice reads every comma and
 * full stop the same, so a startled "Suddenly, Milo jumps on Tom's face." comes
 * out as flat as a shopping list. This finds the few places in a line where a
 * person would hold the beat — after a lead-in like "Suddenly,", before a short
 * punchline like "The same thing!", after a one-word reaction, before a
 * reaction that follows a long sentence — and nowhere else: at most ONE pause in
 * a line, and most lines have none, so it is a touch and never a performance.
 *
 * The pause lives only in the spoken text sent to the voice: the learner reads
 * the line as written, and only an admin is shown where the voice will pause
 * (see PassageText). Pure and deterministic — the same line always gets the same
 * plan — so it is tested, and a re-run of the audio script never changes what an
 * unchanged line sounds like.
 *
 * Two ways to take over by hand, both stored next to the line in the data: a
 * `pause` hint (put the pause somewhere else, or "none" to remove it) and a
 * full `say` (the author's own spoken text, which is sent exactly as written).
 */

export type PauseLength = "short" | "long";

export interface PausePlan {
  /** Where in the text the pause falls: 0 is before the whole line. */
  at: number;
  length: PauseLength;
  reason: "lead-in" | "reaction" | "punchline" | "reveal" | "beat" | "hand-placed";
}

/**
 * An author's say-so about a line's pause: "none" removes the automatic one; `after` puts it right after that exact piece of the line (which must appear in it); `before` puts it before the line. `length` is short unless said otherwise.
 */
export type PauseHint =
  "none" | { after: string; length?: PauseLength } | { before: true; length?: PauseLength };

export interface PauseContext {
  /** The line just before this one in the same part — what a reaction answers. */
  previous?: string;
  /** A character is speaking (not the narrator): a punchline is then only taken at an opener that really marks a reveal. */
  dialogue?: boolean;
}

/** Openers that mean "something is about to happen", with the comma that follows. */
const LEAD_INS_WITH_COMMA = [
  "suddenly",
  "just then",
  "at that moment",
  "all at once",
  "out of nowhere",
  "without warning",
  "to his surprise",
  "to her surprise",
  "to their surprise",
  "to my surprise",
  "at last",
  "oh no",
  "oh dear",
  "wait",
  "wow",
  "look",
] as const;

/** Openers strong enough to hold the beat even without a comma: "Suddenly Milo…", "But then the phone rang." */
const LEAD_INS_BARE = [
  "suddenly",
  "just then",
  "but then",
  "at that moment",
  "all at once",
] as const;

/** A short first sentence that is itself a reaction ("Oh no! …", "What? …", "Bang! …"): the line breathes after it. */
const REACTIONS = new Set([
  "what",
  "wait",
  "wow",
  "oh",
  "oh no",
  "oh dear",
  "really",
  "no way",
  "hey",
  "stop",
  "help",
  "bang",
  "boom",
  "crash",
]);

/** In a character's speech a short closing sentence only marks a reveal when it opens like one. */
const REVEAL_OPENERS = new Set([
  "only",
  "maybe",
  "best",
  "worst",
  "just",
  "not",
  "never",
  "nobody",
  "nothing",
  "even",
]);

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const ENDS_STRONG = /[!?]["'”’)]*$/;

/** The text split into sentences with their start offsets (a sentence ends at . ! or ? followed by a space). */
function sentencesOf(text: string): { start: number; text: string }[] {
  const out: { start: number; text: string }[] = [];
  const pattern = /[^.!?]+[.!?]+["'”’)]*(?=\s|$)|[^.!?]+$/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const trimmedStart = match[0].length - match[0].trimStart().length;
    const sentence = match[0].trim();
    if (sentence) out.push({ start: match.index + trimmedStart, text: sentence });
  }
  return out;
}

/**
 * The one pause this line gets by the rules, or null. Rules are tried in order
 * and the first that fits wins.
 */
export function pausePlanFor(text: string, context: PauseContext = {}): PausePlan | null {
  const line = text.trim();
  if (!line || line.includes("...") || line.includes("…")) return null;

  const sentences = sentencesOf(line);

  // 1. A lead-in at the start of any sentence: "Suddenly, | Milo jumps…". With its comma, or — for the strong ones — without.
  for (const sentence of sentences) {
    const lower = sentence.text.toLowerCase();
    for (const leadIn of LEAD_INS_WITH_COMMA) {
      if (
        lower.startsWith(`${leadIn},`) &&
        wordCount(sentence.text.slice(leadIn.length + 1)) >= 3
      ) {
        return { at: sentence.start + leadIn.length + 1, length: "short", reason: "lead-in" };
      }
    }
    for (const leadIn of LEAD_INS_BARE) {
      const rest = sentence.text.slice(leadIn.length);
      if (lower.startsWith(`${leadIn} `) && wordCount(rest) >= 3) {
        return { at: sentence.start + leadIn.length, length: "short", reason: "lead-in" };
      }
    }
    // "Then, to Mark's great surprise, he started to laugh." — the beat is after "surprise,".
    const surprise = /^(?:then,\s+)?to [^,.!?]{1,24}\bsurprise,/i.exec(sentence.text);
    if (surprise && wordCount(sentence.text.slice(surprise[0].length)) >= 3) {
      return { at: sentence.start + surprise[0].length, length: "short", reason: "lead-in" };
    }
  }

  // 2. A reaction that opens a longer line: "What? | You're not hungry?".
  const first = sentences[0];
  if (first && sentences.length >= 2 && ENDS_STRONG.test(first.text)) {
    const core = first.text
      .replace(/[^\p{L}\s']/gu, "")
      .trim()
      .toLowerCase();
    if (wordCount(core) <= 2 && REACTIONS.has(core)) {
      return { at: first.start + first.text.length, length: "short", reason: "reaction" };
    }
  }

  // 3. A short punchline closing a longer line: "Tom opens a third box. | The same thing!".
  const last = sentences[sentences.length - 1];
  const before = sentences[sentences.length - 2];
  if (
    last &&
    before &&
    /!["'”’)]*$/.test(last.text) &&
    wordCount(last.text) <= 4 &&
    wordCount(before.text) >= 3
  ) {
    const opener = last.text
      .split(/\s+/)[0]!
      .replace(/[^\p{L}']/gu, "")
      .toLowerCase();
    if (!context.dialogue || REVEAL_OPENERS.has(opener)) {
      return { at: last.start, length: "short", reason: "punchline" };
    }
  }

  // 4. A reveal after a colon, in the narration: it means: | "Food. Now."
  if (!context.dialogue) {
    const colon = line.search(/:\s*["“]/);
    if (colon > 0) {
      const quoted = line.slice(colon + 1).replace(/["“”]/g, "");
      if (wordCount(quoted) <= 4) return { at: colon + 1, length: "short", reason: "reveal" };
    }
  }

  // 5. A one-to-three-word exclamation or question right after a long sentence: "… runs away. | MILO!".
  if (
    context.previous &&
    sentences.length === 1 &&
    wordCount(line) <= 3 &&
    ENDS_STRONG.test(line) &&
    wordCount(context.previous) >= 9
  ) {
    return { at: 0, length: "short", reason: "beat" };
  }

  return null;
}

/**
 * The plan an author's hint asks for: null when it asks for none, a plan when
 * it places one, undefined when the hint does not apply (no hint, or its
 * anchor is not in this text) and the rules should decide.
 */
export function planFromHint(
  text: string,
  hint: PauseHint | undefined,
): PausePlan | null | undefined {
  if (hint === undefined) return undefined;
  if (hint === "none") return null;
  const length = hint.length ?? "short";
  if ("before" in hint) return { at: 0, length, reason: "hand-placed" };
  const index = text.toLowerCase().indexOf(hint.after.toLowerCase());
  if (index < 0) return undefined;
  const at = index + hint.after.length;
  return at >= text.trimEnd().length ? undefined : { at, length, reason: "hand-placed" };
}

/** What is wrong with a hint for this line, in plain words — or null when it is fine. */
export function problemWithHint(en: string, hint: PauseHint): string | null {
  if (hint === "none") return null;
  if ("before" in hint) return null;
  if (!hint.after.trim()) return "pause.after is empty";
  const index = en.indexOf(hint.after);
  if (index < 0) return `pause.after "${hint.after}" is not in the line`;
  if (index + hint.after.length >= en.trimEnd().length) {
    return `pause.after "${hint.after}" is the end of the line — there is nothing after it to pause before`;
  }
  return null;
}

/** How many words of the text come before a position — what the reader uses to show where the voice pauses. */
export function wordsBefore(text: string, at: number): number {
  return text.slice(0, at).split(/\s+/).filter(Boolean).length;
}

/** One pause as the reader draws it for an admin: after how many words of the line, and how long. */
export interface PauseMark {
  afterWord: number;
  length: PauseLength;
}

/** How a model is told to pause: v3 takes punctuation (ellipses), the older models take a break tag. */
export type PauseStyle = "ellipsis" | "break";

export function pauseStyleFor(model: string | null | undefined): PauseStyle {
  return model && !model.toLowerCase().startsWith("eleven_v3") ? "break" : "ellipsis";
}

const BREAK_SECONDS: Record<PauseLength, string> = { short: "0.4s", long: "0.8s" };

/** The text with the planned pause written into it, in the style the voice model understands. */
export function withPause(text: string, plan: PausePlan | null, style: PauseStyle): string {
  if (!plan) return text;
  const line = text.trim();
  const head = line.slice(0, plan.at).trimEnd();
  const tail = line.slice(plan.at).trimStart();

  if (style === "break") {
    const tag = `<break time="${BREAK_SECONDS[plan.length]}" />`;
    return plan.at === 0 ? `${tag} ${line}` : `${head} ${tag} ${tail}`;
  }

  const dots = plan.length === "long" ? "... ..." : "...";
  if (plan.at === 0) return `${dots} ${line}`;
  // "Suddenly," and "tired." give up their comma or full stop to the ellipsis; "Oh no!" keeps its mark.
  const strong = ENDS_STRONG.test(head);
  const kept = strong ? head : head.replace(/[,.;:]+$/, "");
  return `${kept}${strong ? " " : ""}${dots} ${tail}`;
}
