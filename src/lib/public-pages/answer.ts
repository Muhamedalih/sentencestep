/** Lower case, one space between words, straight apostrophes: "Aren’t " and "aren't" are the same answer. */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRightAnswer(value: string, answers: readonly string[]): boolean {
  const typed = normalizeAnswer(value);
  return typed !== "" && answers.some((answer) => normalizeAnswer(answer) === typed);
}
