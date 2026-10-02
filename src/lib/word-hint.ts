/**
 * What a hint does in Word Lists' "Smart word practice".
 *
 * A hint never gives the same thing twice, and never gives what the learner
 * already has: it looks at what has been typed, keeps the letters that are
 * right, takes away everything after the first wrong one, and puts in the NEXT
 * right letter. Two right letters typed → the hint adds the third. Three right
 * and then two wrong → the two wrong ones go and the fourth (right) letter takes
 * their place. Nothing typed → the first letter.
 *
 * Pure and client-safe, so the rule is tested without a browser; the typing
 * engine (useWordTypingEngine) runs the plan and the stage draws it.
 */

/** A letter reduced to what matters for comparing: accents dropped, case ignored. */
function fold(char: string): string {
  return char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export interface HintPlan {
  /** The accepted answer this hint follows: the stored word, or the alternate the learner is already typing. */
  answer: string;
  /** How many of the typed letters are right and stay. */
  keep: number;
  /** How many typed letters come after them and are taken away. */
  remove: number;
  /** The letter the hint puts in, in the answer's own spelling. Empty when every right letter was already there and only extra ones were typed. */
  add: string;
}

/**
 * The answers a hint may follow: the stored word first, then its alternates, as
 * spelled (not folded — the letter the hint adds is shown to the learner).
 */
function candidateAnswers(target: string, alternates?: readonly string[] | null): string[] {
  const seen = new Set<string>();
  const answers: string[] = [];
  for (const raw of [target, ...(alternates ?? [])]) {
    const answer = raw.trim();
    const key = Array.from(answer).map(fold).join("");
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    answers.push(answer);
  }
  return answers;
}

/**
 * Plans the hint for what has been typed so far, or null when there is nothing
 * to give (the whole answer is already typed).
 *
 * A word with alternates is followed along whichever accepted answer the learner
 * has typed the most of ("gre" is on its way to "grey", not to "gray"); when
 * they are equally far along, the stored word wins.
 */
export function planHint(
  typed: string,
  target: string,
  alternates?: readonly string[] | null,
): HintPlan | null {
  const typedChars = Array.from(typed);
  let best: { answer: string; chars: string[]; keep: number } | null = null;
  for (const answer of candidateAnswers(target, alternates)) {
    const chars = Array.from(answer);
    let keep = 0;
    while (
      keep < typedChars.length &&
      keep < chars.length &&
      fold(typedChars[keep]!) === fold(chars[keep]!)
    ) {
      keep += 1;
    }
    if (!best || keep > best.keep) best = { answer, chars, keep };
  }
  if (!best) return null;

  const remove = typedChars.length - best.keep;
  const add = best.chars[best.keep] ?? "";
  if (remove === 0 && add === "") return null;
  return { answer: best.answer, keep: best.keep, remove, add };
}

/** The answer once the hint is in: the learner's own right letters (their casing kept), then the new one. */
export function applyHint(typed: string, plan: HintPlan): string {
  return Array.from(typed).slice(0, plan.keep).join("") + plan.add;
}
