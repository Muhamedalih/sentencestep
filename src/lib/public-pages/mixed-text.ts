export interface TextSegment {
  text: string;
  /** True for a run of English words, which the page shows left to right inside Arabic text. */
  latin: boolean;
}

/**
 * English words and whole English sentences inside an Arabic sentence ("نستعمل since مع نقطة البداية
 * (since 2020)") are shown as their own left-to-right pieces, so the punctuation around them does not jump
 * to the wrong side. A run is words joined by spaces, "/", "+" or "-", sentence punctuation between English
 * words ("I like music. Dogs are loyal."), and the brackets around it when both are there.
 */
const RUN =
  /\(?[A-Za-z][A-Za-z0-9'’-]*(?:(?:[.,!?]+ |[ /+–-]+)[A-Za-z0-9][A-Za-z0-9'’-]*)*[.!?]*\)?/g;

export function segmentMixed(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  const push = (value: string, latin: boolean) => {
    if (value) segments.push({ text: value, latin });
  };
  for (const match of text.matchAll(RUN)) {
    let run = match[0];
    let start = match.index ?? 0;
    // Closing punctuation stays with a real English sentence ("I like music."), but belongs to the Arabic
    // sentence after one or two English words ("فاستعمل since."), where it must sit at the Arabic side.
    if (!run.endsWith(")")) {
      const trimmed = run.replace(/[.!?]+$/, "");
      if (trimmed !== run && (trimmed.match(/[A-Za-z0-9'’-]+/g) ?? []).length < 3) run = trimmed;
    }
    // A bracket that is not closed (or opened) inside the run belongs to the Arabic around it.
    if (run.startsWith("(") && !run.endsWith(")")) {
      push(text.slice(last, start + 1), false);
      run = run.slice(1);
      start += 1;
      last = start;
    } else if (run.endsWith(")") && !run.startsWith("(")) {
      run = run.slice(0, -1);
      push(text.slice(last, start), false);
      push(run, true);
      last = start + run.length;
      continue;
    }
    push(text.slice(last, start), false);
    push(run, true);
    last = start + run.length;
  }
  push(text.slice(last), false);
  return segments;
}

/** The plain text of a string that may carry the English markers (used for structured data and meta text). */
export function plainText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Splits "She [is] at home" into the parts outside and inside the brackets: the page colours the part the rule is about. */
export function splitBrackets(text: string): { text: string; marked: boolean }[] {
  const parts: { text: string; marked: boolean }[] = [];
  const pattern = /\[([^\]]+)\]/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index), marked: false });
    parts.push({ text: match[1]!.split("|")[0]!, marked: true });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), marked: false });
  return parts;
}
