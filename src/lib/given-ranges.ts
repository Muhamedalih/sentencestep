/**
 * Stretches of a sentence the learner does not type (a character's name in the day's scene): the
 * typing engine writes them in by itself and a backspace passes over them. A range is [start, end)
 * in the sentence, in reading order.
 */
export type GivenRange = readonly [number, number];

/** `typed` (a prefix of `target`) with every range that comes next written in. */
export function fillRanges(target: string, typed: string, ranges: readonly GivenRange[]): string {
  let length = typed.length;
  for (const [start, end] of ranges) {
    if (length >= start && length < end) length = end;
  }
  return length === typed.length ? typed : target.slice(0, length);
}

/**
 * A backspace that lands in (or right after) a given stretch takes the learner's own character
 * before it, not a letter of the stretch.
 */
export function backspaceOverRanges(
  target: string,
  typed: string,
  ranges: readonly GivenRange[],
): string {
  let length = typed.length;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const [start, end] = ranges[i]!;
    if (length >= start && length < end) length = Math.max(0, start - 1);
  }
  return fillRanges(target, target.slice(0, length), ranges);
}
