/**
 * Which words deserve one of Today's five review places. The review sources (typed mistakes, words
 * met in lessons) can hold any word a learner ever got wrong — "and", "into", "isn't" — and a review
 * of those is noise. Only content words count: no function words, no contractions, nothing shorter
 * than three letters. Word Lists words and saved cards are the learner's own choices, so they skip
 * this check.
 */
const FUNCTION_WORDS = new Set(
  (
    "the an this that these those some any each every all both either neither another other such " +
    "me my mine myself you your yours yourself him his himself she her hers herself its itself " +
    "we us our ours ourselves they them their theirs themselves who whom whose what which " +
    "are was were been being does did done has had having will would shall should can could may might must " +
    "and but nor yet because than while when where how why whether although though unless until since after " +
    "before during about above across against along among around behind below beside between beyond down for " +
    "from inside into like near off onto out outside over past through toward towards under upon with within without " +
    "not yes very too also just only even then there here now so much many more most less least really quite rather almost " +
    "get got let say said one"
  ).split(" "),
);

export function isImportantWord(word: string): boolean {
  const text = word.trim().toLowerCase();
  if (text.length < 3) return false;
  // Letters only: a contraction ("isn't"), a number or a stray symbol is not a word to learn.
  if (!/^[a-z]+$/.test(text)) return false;
  return !FUNCTION_WORDS.has(text);
}
