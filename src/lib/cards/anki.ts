/**
 * Builds the file a learner imports into Anki (File → Import). Anki's text
 * import understands `#key:value` header lines, so the file carries its own
 * settings — tab separator, HTML on, the note type, the deck, which column is
 * the tags — and the learner just picks the file. Pure, so the format is
 * unit-tested rather than trusted.
 */

export interface AnkiCard {
  word: string;
  meaning: string;
  sentenceEn: string;
  /** Original whitespace-split word position in sentenceEn (the word to blank). */
  wordIndex: number;
  lessonTitle: string;
  mode: string;
}

const BLANK = "_____";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** A field value safe inside a tab-separated line: no tabs, no line breaks (Anki would read them as a new field/row). */
function field(text: string): string {
  return text.replace(/[\t\r\n]+/g, " ").trim();
}

export function blankOutWord(sentence: string, wordIndex: number): string {
  const words = sentence.split(/\s+/);
  if (wordIndex < 0 || wordIndex >= words.length) return sentence;
  words[wordIndex] = BLANK;
  return words.join(" ");
}

/** Anki tags can't contain spaces. */
function tag(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildAnkiTsv(cards: readonly AnkiCard[], deckName = "SentenceStep"): string {
  const header = [
    "#separator:tab",
    "#html:true",
    "#notetype:Basic",
    `#deck:${field(deckName)}`,
    "#columns:Front\tBack\tTags",
    "#tags column:3",
  ];
  const rows = cards.map((card) => {
    const front = `${escapeHtml(field(blankOutWord(card.sentenceEn, card.wordIndex)))}<br>${escapeHtml(field(card.meaning))}`;
    const back = `<b>${escapeHtml(field(card.word))}</b><br>${escapeHtml(field(card.sentenceEn))}<br><i>${escapeHtml(field(card.lessonTitle))}</i>`;
    const tags = ["sentencestep", tag(card.mode)].filter(Boolean).join(" ");
    return `${field(front)}\t${field(back)}\t${tags}`;
  });
  return `${[...header, ...rows].join("\n")}\n`;
}
