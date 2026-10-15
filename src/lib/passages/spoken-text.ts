/**
 * What the narrator actually says for a passage line. Passages are displayed
 * the way a real message looks (an email in capitals, a text with an emoji),
 * but a text-to-speech voice would shout the capitals and either skip the
 * emoji or read its name, so the spoken text is derived from the displayed
 * text — or taken from the author's own `say` when the line needs a spelled-out
 * number or similar. Pure, so it is shared by the audio script and its tests.
 */

const EMOJI = /[\p{Extended_Pictographic}️‍]/gu;

function hasLowercaseLetter(text: string): boolean {
  return /\p{Ll}/u.test(text);
}

/** "HELLO SARA. THIS IS DAD." -> "Hello sara. This is dad." — sentence case, so the voice speaks it calmly. Case does not change how a voice pronounces a name, so names are not restored. */
function toSentenceCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^|[.!?]\s+)(\p{L})/gu, (_match, lead: string, letter: string) => {
      return `${lead}${letter.toUpperCase()}`;
    })
    .replace(/\bi\b/g, "I");
}

export function spokenTextFor(line: { en: string; say?: string }): string {
  if (line.say && line.say.trim()) return line.say.trim();

  let text = line.en
    .replace(EMOJI, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (text.length > 0 && !hasLowercaseLetter(text)) text = toSentenceCase(text);
  return text;
}
