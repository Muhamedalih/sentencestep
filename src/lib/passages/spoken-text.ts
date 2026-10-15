/**
 * What the narrator actually says for a passage line. Passages are displayed
 * the way a real message looks (an email in capitals, a text with an emoji),
 * but a text-to-speech voice would shout the capitals and either skip the
 * emoji or read its name, so the spoken text is derived from the displayed
 * text — or taken from the author's own `say` when the line needs a spelled-out
 * number or similar. Pure, so it is shared by the audio script and its tests.
 */

import {
  pausePlanFor,
  pauseStyleFor,
  planFromHint,
  withPause,
} from "@/lib/passages/narration-pauses";
import type { PauseHint, PausePlan } from "@/lib/passages/narration-pauses";

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

/** What the narration needs to know about a line. */
export interface NarrationLine {
  en: string;
  say?: string;
  /** The speaking character; absent for the narrator. */
  who?: string;
  /** The author's say-so about where the voice pauses (see narration-pauses.ts). */
  pause?: PauseHint;
}

/**
 * The spoken text of a line and the one small pause a person would take in it:
 * the author's own `pause` hint when there is one, else what the rules find
 * (see narration-pauses.ts). A line with its own `say` is sent exactly as the
 * author wrote it, so it gets no pause of ours.
 */
export function narrationPlanFor(
  line: NarrationLine,
  previousEn?: string,
): { spoken: string; plan: PausePlan | null } {
  const spoken = spokenTextFor(line);
  if (line.say && line.say.trim()) return { spoken, plan: null };

  const hinted = planFromHint(spoken, line.pause);
  if (hinted !== undefined) return { spoken, plan: hinted };

  const previous = previousEn === undefined ? undefined : spokenTextFor({ en: previousEn });
  return { spoken, plan: pausePlanFor(spoken, { previous, dialogue: Boolean(line.who) }) };
}

/**
 * What is actually sent to the voice: the spoken text with its pause written
 * the way the voice model understands it. The learner never sees any of this —
 * it exists only in the request to the voice (and, for an admin, as a marker in
 * the reader). `say` is also how to place or move a pause by hand.
 */
export function narrationTextFor(
  line: NarrationLine,
  options: { model?: string | null; previousEn?: string; pauses?: boolean } = {},
): string {
  const { spoken, plan } = narrationPlanFor(line, options.previousEn);
  if (options.pauses === false) return spoken;
  return withPause(spoken, plan, pauseStyleFor(options.model));
}
